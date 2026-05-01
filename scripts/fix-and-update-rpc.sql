-- ============================================================
-- FIX SEQUENCES (Run this in Supabase Dashboard > SQL Editor)
-- This fixes the root cause of "duplicate key value" errors
-- ============================================================

-- Fix order sequence
SELECT setval(
  pg_get_serial_sequence('public."order"', 'id'),
  COALESCE((SELECT MAX(id) FROM public."order"), 0) + 1,
  false
);

-- Fix order_items sequence
SELECT setval(
  pg_get_serial_sequence('public.order_items', 'id'),
  COALESCE((SELECT MAX(id) FROM public.order_items), 0) + 1,
  false
);

-- Fix receipts sequence
SELECT setval(
  pg_get_serial_sequence('public.receipts', 'id'),
  COALESCE((SELECT MAX(id) FROM public.receipts), 0) + 1,
  false
);

-- Fix receipt_items sequence
SELECT setval(
  pg_get_serial_sequence('public.receipt_items', 'id'),
  COALESCE((SELECT MAX(id) FROM public.receipt_items), 0) + 1,
  false
);


-- ============================================================
-- UPDATE create_order_with_receipt TO HANDLE SEQUENCE CONFLICTS
-- This replaces the existing function with one that auto-fixes
-- sequences before inserting, preventing PK conflicts.
-- It also ensures true atomicity: if ANYTHING fails, ALL
-- changes (including balance) are rolled back automatically.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order_with_receipt(
  p_customer INTEGER,
  p_items JSONB,
  p_payment_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_status TEXT DEFAULT 'paid',
  p_total_amount NUMERIC DEFAULT 0,
  p_balance_due NUMERIC DEFAULT 0,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id INTEGER;
  v_receipt_id INTEGER;
  v_receipt_number TEXT;
  v_client_name TEXT;
  v_client_balance NUMERIC;
  v_item JSONB;
  v_updated_balance NUMERIC;
  v_receipt_date TIMESTAMPTZ;
BEGIN
  -- Validate customer exists
  SELECT name, balance INTO v_client_name, v_client_balance
  FROM public.client
  WHERE id = p_customer;
  
  IF v_client_name IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
  
  -- Validate items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  
  -- ========================================
  -- Fix sequences BEFORE inserting
  -- This ensures no PK conflicts
  -- ========================================
  PERFORM setval(
    pg_get_serial_sequence('public."order"', 'id'),
    GREATEST(
      (SELECT COALESCE(MAX(id), 0) FROM public."order") + 1,
      currval(pg_get_serial_sequence('public."order"', 'id'))
    ),
    false
  );
  
  PERFORM setval(
    pg_get_serial_sequence('public.order_items', 'id'),
    GREATEST(
      (SELECT COALESCE(MAX(id), 0) FROM public.order_items) + 1,
      currval(pg_get_serial_sequence('public.order_items', 'id'))
    ),
    false
  );
  
  PERFORM setval(
    pg_get_serial_sequence('public.receipts', 'id'),
    GREATEST(
      (SELECT COALESCE(MAX(id), 0) FROM public.receipts) + 1,
      currval(pg_get_serial_sequence('public.receipts', 'id'))
    ),
    false
  );
  
  PERFORM setval(
    pg_get_serial_sequence('public.receipt_items', 'id'),
    GREATEST(
      (SELECT COALESCE(MAX(id), 0) FROM public.receipt_items) + 1,
      currval(pg_get_serial_sequence('public.receipt_items', 'id'))
    ),
    false
  );
  
  -- ========================================
  -- 1. Create Order (triggers balance update)
  -- ========================================
  INSERT INTO public."order" (client_id, total, date, payment_amount, payment_method, payment_status, balance_due)
  VALUES (p_customer, p_total_amount, p_date, p_payment_amount, p_payment_method, p_payment_status, p_balance_due)
  RETURNING id INTO v_order_id;
  
  -- ========================================
  -- 2. Create Order Items
  -- ========================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, item_id, quantity, price)
    VALUES (
      v_order_id,
      (v_item->>'product')::INTEGER,
      (v_item->>'quantity')::NUMERIC,
      COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'price')::NUMERIC, 0)
    );
  END LOOP;
  
  -- ========================================
  -- 3. Generate Receipt Number
  -- ========================================
  SELECT 'RCPT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
         LPAD(COALESCE((SELECT COUNT(*) + 1 FROM public.receipts 
                        WHERE receipt_date::date = CURRENT_DATE), 1)::TEXT, 6, '0')
  INTO v_receipt_number;
  
  -- ========================================
  -- 4. Calculate updated balance
  -- ========================================
  v_updated_balance := v_client_balance + p_balance_due;
  v_receipt_date := NOW();
  
  -- ========================================
  -- 5. Create Receipt
  -- ========================================
  INSERT INTO public.receipts (
    order_id, client_id, customer_name, previous_balance,
    current_bill_amount, payment_made, this_bill_balance,
    updated_balance, receipt_number, receipt_date
  )
  VALUES (
    v_order_id, p_customer, v_client_name, v_client_balance,
    p_total_amount, p_payment_amount, p_balance_due,
    v_updated_balance, v_receipt_number, v_receipt_date
  )
  RETURNING id INTO v_receipt_id;
  
  -- ========================================
  -- 6. Create Receipt Items
  -- ========================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.receipt_items (
      receipt_id, product_id, product_name, quantity,
      unit, price_per_unit, total
    )
    VALUES (
      v_receipt_id,
      COALESCE((v_item->>'product')::INTEGER, 0),
      COALESCE(v_item->>'name', 'Product'),
      (v_item->>'quantity')::NUMERIC,
      COALESCE(v_item->>'unit', 'kg'),
      COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'price')::NUMERIC, 0),
      COALESCE((v_item->>'lineTotal')::NUMERIC, (v_item->>'total')::NUMERIC, 0)
    );
  END LOOP;
  
  -- ========================================
  -- Return result
  -- ========================================
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'receipt_id', v_receipt_id,
    'receipt_number', v_receipt_number,
    'receipt_date', v_receipt_date,
    'customer_name', v_client_name,
    'previous_balance', v_client_balance,
    'updated_balance', v_updated_balance,
    'current_bill_amount', p_total_amount,
    'payment_made', p_payment_amount,
    'this_bill_balance', p_balance_due,
    'payment_status', p_payment_status
  );
  
  -- If ANY of the above fails, PostgreSQL automatically
  -- rolls back the ENTIRE function, including the order
  -- insert and the balance trigger update.
END;
$$;
