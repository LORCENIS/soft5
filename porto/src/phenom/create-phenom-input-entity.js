#!/usr/bin/env softshell
var entity = require('porto.entity');

println = function (args) {
   console.raw(JSON.stringify(args, null, 2) + "\n");
}

try {
   porto.PhenomInput = entity.using('phenom-input', 'eu.nanosim.phenom', '1');
}
catch (err) {
   println(err);
   // @TODO Terminate here
};

__main__ = function (args) {
   try {
      var storage = new porto.Storage("mongo2", "mongodb://localhost", "db=porto;coll=demo");

      entity = new porto.PhenomInput();

      entity.Nads = 4; // Number of adsorbing species
      entity.Ncomp = 6; // Number of gas species
      entity.Ncomp_T = 9; // Gas+solid species
      entity.Nrx_g = 3; // Number of reforming reactions
      entity.Nrx_s = 3; // Number of het reactions
         
      entity.Ac = 6.2812;  // Cross sect bed area  (1)
      entity.ADENT = [-38280.0, -70650.0, -82900.0, 88680.0];  // Enthalpy of adsorption CH4 CO H2 H2O (Nads adsorption reactions)
      entity.B = [1.0000e-06, 1.5000e-06, 1.5000e-06, 6.5000e-07, 1.7400e-06, 1.4000e-06];  // Viscosity coeffs CH4 CO CO2 H2 H2O N2 (Ncomp)
      entity.BET_a0 = 23.3000;  // Spec surface area (1)
      entity.CP = [
         [1.93e+04, 3.09e+04, 1.98e+04, 2.71e+04, 3.22e+04, 3.12e+04],
         [5.21e+01, -1.29e+01, 7.34e+01, 9.27e+00, 1.92e+00, -1.36e+01],
         [1.20e-02, 2.79e-02, -5.60e-02, -1.38e-02, 1.06e-02, 2.68e-02],
         [-1.13e-05, -1.27e-05, 1.72e-05, 7.65e-06, 3.60e-06, -1.17e-05]
      ];  // Heat capacity coeffs 4coeff x Ncomp species
      entity.CP_s = 1200.0;  // Solid heat transfer coeff
      entity.deltaHf = [-74900.0, -110600.0, -393800.0, 0.0, -242000.0, 0.0];  // Heat of formation, gas (Ncomp species)
      entity.deltaHf_s = [0.0, -244300.0, -2.33781e+06];  // Heat of form Ni NiO MgAl2O4 ((Ncomp_T-Ncomp) species)
      entity.Dt = 2.9000;  // ReactorE diameter (1)
      entity.E = [218550,0, 73523.0, 236850.0, 5800.0];  // Activation energies (Nads adsorption reactions)
      entity.Ea_s = [78000.0, 26000.0, 25000.0];  // Act energy (Nrx_s solid rx)
      entity.ENT298 = [206300.0, -41200.0, 165100.0, 0.0];  // Reaction enthalpy 298 K ((Nrx_g+1) rx)
      entity.F_sol_w = 132.6600;
      entity.Flowin_w = 7.5200;
      entity.Fluxin_w = 1.1972;
      entity.FRACin = [0.3116, 0.0, 0.0691, 0.0066, 0.6079, 0.0049]; // Mass fractions gas at inlet (Ncomp species)
      entity.FRACin_s = [0.0295, 0.0852, 0.8853]; // Mass fract at inlet solid   ((Ncomp_T-Ncomp) species)
      entity.Fw = [2.34309, 0.0, 0.519583, 0.0494741, 4.57111, 0.0367382]; // Kg/s of each species  (Ncomp)
      entity.Gs0 = 120;
      entity.Heq = [223080.0, -36580.0, 186500.0, 0.0]; // Equilibrium enthalpies (Nads rx)
      entity.K_0i = [6.6600e-04, 8.2500e-05, 6.1500e-09, 177000.0,]; // Pre-exponential factors, Nads adsorption reactions
      entity.k_0j = [5.8300e+11, 25100.0, 4.6700e+13, 8.4800e-05]; // Preexp factors reforming (Nrx_g+1)
      entity.k0_s = [0.7100, 0.0093, 0.0052]; // Preexp for heterogeneous kinetics (Nrx_s rx)
      entity.Keq_j = [1.2000e+13, 0.0177, 2.1240e+11, 0.0]; // Equilibr constants, (Nads rx)
      entity.MW = [0.01604, 0.028, 0.044, 0.00202, 0.01802, 0.028]; // Molar weights (Ncomp species)
      entity.MW_O2 = 0.0320; // 
      entity.MW_s = [0.0587, 0.0747, 0.1423]; // Molar weight, (Ncomp_T-Ncomp) solid species
      entity.n_rx = [0.8000, 0.5000, 0.8000]; // Reaction order heterogeneous rx  (Nrx_s)
                            
      entity.Pin = 5050000;
      entity.R0_NiAl2O4 = 0.1125;
      entity.R0_NiO = 0.2142;
      entity.rhogm = 624.1327;
      entity.rhogmWin = 10.7314;
      entity.RHOin = 624.1327;
      entity.rhos0 = 3451;
      entity.Smu = [165.0, 220.0, 220.0, 67.0, 626.0, 108.0]; // Viscosity parameter, (Ncomp) gases
      entity.Stoich = [
         [-1.00e+00,  0.00e+00, -1.00e+00,  0.00e+00],
         [ 1.00e+00, -1.00e+00,  0.00e+00,  0.00e+00],
         [ 0.00e+00,  1.00e+00,  1.00e+00,  0.00e+00],
         [ 3.00e+00,  1.00e+00,  4.00e+00, -1.00e+00],
         [-1.00e+00, -1.00e+00, -2.00e+00,  0.00e+00],
         [ 0.00e+00,  0.00e+00,  0.00e+00,  0.00e+00]
      ]; // Stoichiometric coeffs (Ncomp x (Nrx_g+1) rx)
      entity.Stoich_s = [
         [-1.00e+00,  0.00e+00,  0.00e+00, 0.00e+00],
         [ 0.00e+00,  0.00e+00, -1.00e+00, 0.00e+00],
         [ 1.00e+00,  0.00e+00,  1.00e+00, 0.00e+00],
         [ 0.00e+00, -1.00e+00,  0.00e+00, 0.00e+00],
         [ 2.00e+00,  1.00e+00,  0.00e+00, 0.00e+00],
         [ 0.00e+00,  0.00e+00,  0.00e+00, 0.00e+00],
         [ 4.00e+00,  1.00e+00,  1.00e+00, 0.00e+00],
         [-4.00e+00, -1.00e+00, -1.00e+00, 0.00e+00],
         [ 0.00e+00,  0.00e+00,  0.00e+00, 0.00e+00],
      ]; // Stoich for solids reactions (Ncomp_T x (Nrx_s+1) rx )

      entity.Tin = 973.1500;
      entity.Uin = 0.1116;
      entity.Yin = [0.3340, 0.0, 0.0270, 0.0560, 0.5800, 0.0030];
      entity.g = 9.8100;
      entity.R = 8.3145;
      entity.C1 = 27.2000;
      entity.C2 = 0.0408;
      entity.A0 = 5.0000e-05;
      entity.dg = 1.0000e-06;
      entity.dp = 2.5000e-04;
      entity.mug = 3.1343e-05;
      entity.rhog = 10.7314;
      entity.P0 = 4.2400e-10;
      entity.Ea = 5800;
      entity.tm = 5.0000e-06;
      entity.dm = 0.0500;
      entity.Nm = 165;


      println(entity);


      storage.save(entity);



      e2 = new porto.ChemkinReaction();

      storage.load(e2);

      println("Dimension Nads: " + e2.Nads);

   } catch (err) {
      console.raw("failed with" + err);
   }
};
