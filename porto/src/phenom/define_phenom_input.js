#!/usr/bin/env softshell

// Create constructor for PhenomInput objects.
PhenomInput = require('porto.entity').using('phenom-input', 'eu.nanosim.phenom', '1');

// Use a local JSON-file to store the phenom input data 
var storage = require('porto.storage').createStorage('json', 'phenom-data.json');


// Instanciate an input Entity
phenom_input = new PhenomInput();

// Set the data
phenom_input.dim.Nads = 4; // Number of adsorbing species
phenom_input.dim.Ncomp = 6; // Number of gas species
phenom_input.dim.Ncomp_T = 9; // Gas+solid species
phenom_input.dim.Nrx_g = 3; // Number of reforming reactions
phenom_input.dim.Nrx_s = 3; // Number of het reactions
phenom_input.Ac = 6.2812;  // Cross sect bed area  (1)
phenom_input.ADENT = [-38280.0, -70650.0, -82900.0, 88680.0];  // Enthalpy of adsorption CH4 CO H2 H2O (Nads adsorption reactions)
phenom_input.B = [1.0000e-06, 1.5000e-06, 1.5000e-06, 6.5000e-07, 1.7400e-06, 1.4000e-06];  // Viscosity coeffs CH4 CO CO2 H2 H2O N2 (Ncomp)
phenom_input.BET_a0 = 23.3000;  // Spec surface area (1)
phenom_input.CP = [
    [1.93e+04, 3.09e+04, 1.98e+04, 2.71e+04, 3.22e+04, 3.12e+04],
    [5.21e+01, -1.29e+01, 7.34e+01, 9.27e+00, 1.92e+00, -1.36e+01],
    [1.20e-02, 2.79e-02, -5.60e-02, -1.38e-02, 1.06e-02, 2.68e-02],
    [-1.13e-05, -1.27e-05, 1.72e-05, 7.65e-06, 3.60e-06, -1.17e-05]
];  // Heat capacity coeffs 4coeff x Ncomp species
phenom_input.CP_s = 1200.0;  // Solid heat transfer coeff
phenom_input.deltaHf = [-74900.0, -110600.0, -393800.0, 0.0, -242000.0, 0.0];  // Heat of formation, gas (Ncomp species)
phenom_input.deltaHf_s = [0.0, -244300.0, -2.33781e+06];  // Heat of form Ni NiO MgAl2O4 ((Ncomp_T-Ncomp) species)
phenom_input.Dt = 2.9000;  // ReactorE diameter (1)
phenom_input.E = [218550.0, 73523.0, 236850.0, 5800.0];  // Activation energies (Nads adsorption reactions)
phenom_input.Ea_s = [78000.0, 26000.0, 25000.0];  // Act energy (Nrx_s solid rx)
phenom_input.ENT298 = [206300.0, -41200.0, 165100.0, 0.0];  // Reaction enthalpy 298 K ((Nrx_g+1) rx)
phenom_input.F_sol_w = 132.6600;
phenom_input.Flowin_w = 7.5200;
phenom_input.Fluxin_w = 1.1972;
phenom_input.FRACin = [0.3116, 0.0, 0.0691, 0.0066, 0.6079, 0.0049]; // Mass fractions gas at inlet (Ncomp species)
phenom_input.FRACin_s = [0.0295, 0.0852, 0.8853]; // Mass fract at inlet solid   ((Ncomp_T-Ncomp) species)
phenom_input.Fw = [2.34309, 0.0, 0.519583, 0.0494741, 4.57111, 0.0367382]; // Kg/s of each species  (Ncomp)
phenom_input.Gs0 = 120;
phenom_input.Heq = [223080.0, -36580.0, 186500.0, 0.0]; // Equilibrium enthalpies (Nads rx)
phenom_input.K_0i = [6.6600e-04, 8.2500e-05, 6.1500e-09, 177000.0,]; // Pre-exponential factors, Nads adsorption reactions
phenom_input.k_0j = [5.8300e+11, 25100.0, 4.6700e+13, 8.4800e-05]; // Preexp factors reforming (Nrx_g+1)
phenom_input.k0_s = [0.7100, 0.0093, 0.0052]; // Preexp for heterogeneous kinetics (Nrx_s rx)
phenom_input.Keq_j = [1.2000e+13, 0.0177, 2.1240e+11, 0.0]; // Equilibr constants, (Nads rx)
phenom_input.MW = [0.01604, 0.028, 0.044, 0.00202, 0.01802, 0.028]; // Molar weights (Ncomp species)
phenom_input.MW_O2 = 0.0320; // 
phenom_input.MW_s = [0.0587, 0.0747, 0.1423]; // Molar weight, (Ncomp_T-Ncomp) solid species
phenom_input.n_rx = [0.8000, 0.5000, 0.8000]; // Reaction order heterogeneous rx  (Nrx_s)

phenom_input.Pin = 5050000;
phenom_input.R0_NiAl2O4 = 0.1125;
phenom_input.R0_NiO = 0.2142;
phenom_input.rhogm = 624.1327;
phenom_input.rhogmWin = 10.7314;
phenom_input.RHOin = 624.1327;
phenom_input.rhos0 = 3451;
phenom_input.Smu = [165.0, 220.0, 220.0, 67.0, 626.0, 108.0]; // Viscosity parameter, (Ncomp) gases
phenom_input.Stoich = [
    [-1.00e+00, 0.00e+00, -1.00e+00, 0.00e+00],
    [1.00e+00, -1.00e+00, 0.00e+00, 0.00e+00],
    [0.00e+00, 1.00e+00, 1.00e+00, 0.00e+00],
    [3.00e+00, 1.00e+00, 4.00e+00, -1.00e+00],
    [-1.00e+00, -1.00e+00, -2.00e+00, 0.00e+00],
    [0.00e+00, 0.00e+00, 0.00e+00, 0.00e+00]
]; // Stoichiometric coeffs (Ncomp x (Nrx_g+1) rx)
phenom_input.Stoich_s = [
    [-1.00e+00, 0.00e+00, 0.00e+00, 0.00e+00],
    [0.00e+00, 0.00e+00, -1.00e+00, 0.00e+00],
    [1.00e+00, 0.00e+00, 1.00e+00, 0.00e+00],
    [0.00e+00, -1.00e+00, 0.00e+00, 0.00e+00],
    [2.00e+00, 1.00e+00, 0.00e+00, 0.00e+00],
    [0.00e+00, 0.00e+00, 0.00e+00, 0.00e+00],
    [4.00e+00, 1.00e+00, 1.00e+00, 0.00e+00],
    [-4.00e+00, -1.00e+00, -1.00e+00, 0.00e+00],
    [0.00e+00, 0.00e+00, 0.00e+00, 0.00e+00],
]; // Stoich for solids reactions (Ncomp_T x (Nrx_s+1) rx )

phenom_input.Tin = 973.1500;
phenom_input.Uin = 0.1116;
phenom_input.Yin = [0.3340, 0.0, 0.0270, 0.0560, 0.5800, 0.0030];
phenom_input.g = 9.8100;
phenom_input.R = 8.3145;
phenom_input.C1 = 27.2000;
phenom_input.C2 = 0.0408;
phenom_input.A0 = 5.0000e-05;
phenom_input.dg = 1.0000e-06;
phenom_input.dp = 2.5000e-04;
phenom_input.mug = 3.1343e-05;
phenom_input.rhog = 10.7314;
phenom_input.P0 = 4.2400e-10;
phenom_input.Ea = 5800;
phenom_input.tm = 5.0000e-06;
phenom_input.dm = 0.0500;
phenom_input.Nm = 165;

// Store the state of phenom_input in the with the chosen storage backend
phenom_input.setAll();
storage.save(phenom_input);

// Print the UUID.
print (phenom_input.id());
