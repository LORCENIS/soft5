#include <stdlib.h>
#include "softc.h"
#include "softc-private.h"

softc_t *softc_init(int argc, char *argv[])
{
  return softc_private_init(argc, argv);
}