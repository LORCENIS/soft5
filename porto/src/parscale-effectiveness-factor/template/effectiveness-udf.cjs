#include "udf.h"

real min_cutoff = 1e-6;          /* Stops the reaction when reactants approach zero to ensure stability */
real Gas_Const = 8.314;          /* Ideal gas constant [J/mol/K] */
real k0 = @{soft.model.k0};      /* Pre-exponential factor [m3/mol/s] from Chemkin files. Chemkin file value [cm3/mol/s] must be divided by 10^6. */
real EA = @{soft.model.EA};      /* Activation energy [J/mol] from Chemkin files. Chemkin file value [kJ/mol] must be multiplied by 10^3. */

DEFINE_HET_RXN_RATE(Rrate,c,t,r,mw,yi,rr,rr_t)
{
   real Rrate, k, X_CH4, MW_CH4, X_Fe2O3, MW_Fe2O3, VOF, T, rho_g, rho_s, eff;
   Thread *tg = THREAD_SUB_THREAD(t,0);
   Thread *ts = THREAD_SUB_THREAD(t,1);

   VOF = C_VOF(c,ts);            /* Particle volume fraction [-]*/
   T = C_T(c,ts);                /* Particle temperature [K]*/
   rho_g = C_R(c,tg);            /* Gas density [kg/m3] */
   rho_s = C_R(c,ts);            /* Particle density [kg/m3] */
   X_CH4 = yi[0][0];             /* Methane mass fraction (check second index if order of species in gas is altered) */
   MW_CH4 = mw[0][0]/1000.;      /* Methane molar weight [kg/mol] (check second index if order of species in gas is altered) */
   X_Fe2O3 = yi[1][1];           /* Hematite mass fraction (check second index if order of species in gas is altered) */
   MW_Fe2O3 = mw[1][1]/1000.;    /* Hematite molar weight [kg/mol] (check second index if order of species in gas is altered) */

   k = k0 * exp(-EA/(Gas_Const*T)); /* Reaction rate constant calculated from Chemkin file inputs [m3/mol/s] */

   eff = @{soft.model.eff};      /* Effectiveness factor from Parscale. Should probably be expressed as a function of the Thiele modulus and the particle conversion. */

   Rrate = eff * VOF * k * (rho_g*X_CH4/MW_CH4) * (rho_s*X_Fe2O3/MW_Fe2O3/6.);  /* Reaction rate [mol/m3/s]. Fe2O3 molar concentration is divided by 6 to represent Fe12O18. */

   if (X_CH4 < min_cutoff) Rrate = 0;

   if (X_Fe2O3 < min_cutoff) Rrate = 0; 

   if (VOF < min_cutoff) Rrate = 0;

   *rr = Rrate / 1000.0;         /* Return final reaction rate to FLUENT [kmol/m3/s] */
}

