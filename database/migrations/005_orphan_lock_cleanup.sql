-- Limpeza de locks orfaos (rodar periodicamente ou no deploy).
-- Execute no TiDB quando necessario.

USE barbearia;

DELETE l FROM appointment_slot_locks l
INNER JOIN appointments a ON a.id = l.appointment_id
WHERE a.status IN ('COMPLETED', 'CANCELLED')
   OR a.appointment_date < CURDATE();
