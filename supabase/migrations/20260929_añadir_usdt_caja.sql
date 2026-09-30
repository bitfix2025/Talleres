-- Agregar USDT como medio de pago de caja
alter table public.movimientos_caja
  drop constraint if exists movimientos_caja_medio_check;

alter table public.movimientos_caja
  add constraint movimientos_caja_medio_check
  check (medio in ('EFECTIVO','BANCO','MERCADO_PAGO','USDT'));

-- Permite registrar USDT también en cuenta corriente.
alter table public.cuentas_corrientes
  drop constraint if exists cuentas_corrientes_medio_check;

alter table public.cuentas_corrientes
  add constraint cuentas_corrientes_medio_check
  check (medio is null or medio in ('EFECTIVO','BANCO','MERCADO_PAGO','USDT'));
