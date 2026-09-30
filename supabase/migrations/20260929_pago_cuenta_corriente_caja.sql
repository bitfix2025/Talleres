-- Registrar un pago de cuenta corriente y su ingreso en Caja
-- La operación es atómica: o se registran ambos movimientos o ninguno.

create or replace function public.registrar_pago_cuenta_corriente(
  p_taller_id bigint,
  p_cliente_id bigint,
  p_monto numeric,
  p_medio text,
  p_concepto text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_medio not in ('EFECTIVO','BANCO','MERCADO_PAGO','USDT') then
    raise exception 'Medio de pago no válido';
  end if;

  insert into public.cuentas_corrientes
    (taller_id, cliente_id, tipo, monto, concepto, medio)
  values
    (p_taller_id, p_cliente_id, 'PAGO', p_monto, p_concepto, p_medio);

  insert into public.movimientos_caja
    (taller_id, tipo, medio, monto, concepto, cliente_id)
  values
    (p_taller_id, 'INGRESO', p_medio, p_monto,
     'Pago cuenta corriente: ' || p_concepto, p_cliente_id);
end;
$$;

revoke all on function public.registrar_pago_cuenta_corriente(bigint,bigint,numeric,text,text) from public;
grant execute on function public.registrar_pago_cuenta_corriente(bigint,bigint,numeric,text,text) to authenticated;
