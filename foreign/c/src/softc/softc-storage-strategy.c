#include "softc-storage-strategy.h"
#include "softc-storage-strategy-private.h"

softc_datamodel_t * softc_storage_strategy_get_datamodel(softc_storage_strategy_t *self)
{
  return softc_storage_strategy_private_get_datamodel(self);
}

void softc_storage_strategy_store(softc_storage_strategy_t *s, const softc_datamodel_t *m)
{
  softc_storage_strategy_private_store(s, m);
}

void softc_storage_strategy_retrieve(softc_storage_strategy_t *s, softc_datamodel_t *m)
{
  softc_storage_strategy_private_retrieve(s, m);
}
