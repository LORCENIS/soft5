# Use Case 4. Providing input to Phenom

This use case demonstrates how to use Porto to generate input to the MATLAB program Phenom. The code for this use case can be found in the `porto/src/phenom` folder of the Porto repository.

Phenom is a 1-D phenomenological model for fluidized bed reactors, which was developed to simulate the performance of second generation CO<sub>2</sub> capture technologies with focus on chemical looping reforming (CLR) [1]. The model consists of a generic formulation based on an averaging probabilistic approach and can be used under bubbling, turbulent and fast fluidization regimes. The main purpose of using a 1-D phenomenological model instead of a more complex fundamental formulation is to provide valuable and sufficiently accurate information of industrial interest with less computational costs and within simulation times in the order of seconds/minutes. 1-D phenomenological models are effective tools for simulation, design and optimization of complex technologies while fundamental computational fluid dynamics (CFD) models are not so easily accessible by the industry. Phenom is implemented in Matlab.

1. Joana Francisco Morgado, Schalk Cloete, John Morud, Thomas Gurker, Shahriar Amini (2017). Modelling study of two chemical looping reforming reactor configurations: looping vs. switching. Powder Technology 316, 599–613


## Walkthrough

Since MATLAB does not presently directly communicate with Porto, we choose to generate a MATLAB function that will return the full set of input parameters needed to run the Phenom code.

This is done by: 

* Ensuring that a Porto entity instance described by `phenom-input.json` is populated with input data, and the entity is registered in the metadata database.
* Retrieving an `phenom-input` entity from the database by referring to its uuid.
* Populating a MATLAB function template with the contents of the `phenom-input` entity.
* Writing the MATLAB function to a `.m` file that can be evaluated.

This entire process can be performed by running the `define-phenom-input.js` and `make-phenom-input.js` script with the uuid of the `phenom-input` entity: 

```bash
$ cd porto/src/phenom 
$ soft-register-entity template/phenom-input.json # Register metadata. (Do this only once!)
$ ./define-phenom-input.js  # Populate an instance of the PhenomInput Entity and stores the data
a6a71841-139a-4310-a9e6-ef7a6f161a6f
$ ./make-phenom-input.js a6a71841-139a-4310-a9e6-ef7a6f161a6f > phenom_input.m
```

This creates the file `phenom_input.m`.

Call the main program of Phenom in Matlab using the input file as argument: 

`phenom_main_fvm('phenom_input');`

This creates plots of the solution as well as an output file `output_cond.mat` that contains the reactor output streams (pressure, temperature, composition of the gas and solids phases). 



## Details

### `phenom-input.json` entity description

The entity describing the input parameters to Phenom is structured in the following entity:

```json
{
    "name": "phenom-input",
    "version": "1",
    "namespace": "eu.nanosim.phenom",
    "description": "Input parameters used to run the Phenom model",
    "dimensions": [
        {
            "name": "Nads",
            "description": "Number of adsorbing species."
        },
        {
            "name": "Ncomp",
            "description": "Number of gas species."
        },
        {
            "name": "Ncomp_T",
            "description": "Number of gas + solid species."
        },
        {
            "name": "Nrx_g",
            "description": "Number of reforming reactions."
        },
        {
            "name": "Ncomp_s",
            "description": "Number of het reactions."
        }
    ],
    "properties": [
        {
            "name": "Ac",
            "type": "double",
            "description": "Cross sect bed area"
        },
        {
            "name": "ADENT",
            "type": "double",
            "dims": [
                "Nads"
            ],
            "description": "Enthalpy of adsorption CH4 CO H2 H2O."
        },
        {
            "name": "B",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Viscosity coeffs CH4 CO CO2 H2 H2O N2."
        },
        {
            "name": "BET_a0",
            "type": "double",
            "description": "Spec surface area."
        },
        {
            "name": "CP",
            "type": "double",
            "dims": [
                4,
                "Ncomp"
            ],
            "description": "Heat capacity coeffs 4coeff x Ncomp species."
        },
        {
            "name": "CP_s",
            "type": "double",
            "description": "Solid heat transfer coeff."
        },
        {
            "name": "deltaHf",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Heat of formation, gas (Ncomp species)."
        },
        {
            "name": "deltaHf_s",
            "type": "double",
            "dims": [
                "Ncomp_T - Ncomp"
            ],
            "description": "Heat of form Ni NiO MgAl2O4 ((Ncomp_T-Ncomp) species)."
        },
        {
            "name": "Dt",
            "type": "double",
            "description": "ReactorE diameter."
        },
        {
            "name": "E",
            "type": "double",
            "dims": [
                "Nads"
            ],
            "description": "Activation energies (Nads adsorption reactions)."
        },
        {
            "name": "Ea_s",
            "type": "double",
            "dims": [
                "Nrx_s"
            ],
            "description": "Act energy (Nrx_s solid rx)."
        },
        {
            "name": "ENT298",
            "type": "double",
            "dims": [
                "Nrx_g + 1"
            ],
            "description": "Reaction enthalpy 298 K ((Nrx_g+1) rx)."
        },
        {
            "name": "F_sol_w",
            "type": "double",
            "description": ""
        },
        {
            "name": "Flowin_w",
            "type": "double",
            "description": ""
        },
        {
            "name": "Fluxin_w",
            "type": "double",
            "description": ""
        },
        {
            "name": "FRACin",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Mass fractions gas at inlet (Ncomp species)"
        },
        {
            "name": "FRACin_s",
            "type": "double",
            "dims": [
                "Ncomp_T - Ncomp"
            ],
            "description": "Mass fract at inlet solid   ((Ncomp_T-Ncomp) species)"
        },
        {
            "name": "Fw",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Kg/s of each species  (Ncomp)"
        },
        {
            "name": "Gs0",
            "type": "double",
            "description": ""
        },
        {
            "name": "Heq",
            "type": "double",
            "dims": [
                "Nads"
            ],
            "description": "Equilibrium enthalpies (Nads rx)"
        },
        {
            "name": "K_0i",
            "type": "double",
            "dims": [
                "Nads"
            ],
            "description": "Pre-exponential factors, Nads adsorption reactions"
        },
        {
            "name": "k_0j",
            "type": "double",
            "dims": [
                "Nrx_g + 1"
            ],
            "description": "Preexp factors reforming (Nrx_g+1)"
        },
        {
            "name": "k0_s",
            "type": "double",
            "dims": [
                "Nrx_s"
            ],
            "description": "Preexp for heterogeneous kinetics (Nrx_s rx)"
        },
        {
            "name": "k0_s",
            "type": "double",
            "dims": [
                "Nrx_s"
            ],
            "description": "Preexp for heterogeneous kinetics (Nrx_s rx)"
        },
        {
            "name": "Keq_j",
            "type": "double",
            "dims": [
                "Nads"
            ],
            "description": "Equilibr constants, (Nads rx)"
        },
        {
            "name": "MW",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Molar weights (Ncomp species)"
        },
        {
            "name": "MW_O2",
            "type": "double",
            "description": ""
        },
        {
            "name": "MW_s",
            "type": "double",
            "dims": [
                "Ncomp_T - Ncomp"
            ],
            "description": "Molar weight, (Ncomp_T-Ncomp) solid species"
        },
        {
            "name": "n_rx",
            "type": "double",
            "dims": [
                "Nrx_s"
            ],
            "description": "Reaction order heterogeneous rx  (Nrx_s)"
        },
        {
            "name": "Pin",
            "type": "double",
            "description": ""
        },
        {
            "name": "R0_NiAl2O4",
            "type": "double",
            "description": ""
        },
        {
            "name": "R0_NiO",
            "type": "double",
            "description": ""
        },
        {
            "name": "rhogm",
            "type": "double",
            "description": ""
        },
        {
            "name": "rhogmWin",
            "type": "double",
            "description": ""
        },
        {
            "name": "RHOin",
            "type": "double",
            "description": ""
        },
        {
            "name": "rhos0",
            "type": "double",
            "description": ""
        },
        {
            "name": "Smu",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Viscosity parameter, (Ncomp) gases"
        },
        {
            "name": "Stoich",
            "type": "double",
            "dims": [
                "Ncomp",
                "Nrx_g + 1"
            ],
            "description": "Stoichiometric coeffs (Ncomp x (Nrx_g+1) rx)"
        },
        {
            "name": "Stoich_s",
            "type": "double",
            "dims": [
                "Ncomp_T",
                "Nrx_s + 1"
            ],
            "description": "Stoich for solids reactions (Ncomp_T x (Nrx_s+1) rx )"
        },
        {
            "name": "Tin",
            "type": "double",
            "description": ""
        },
        {
            "name": "Uin",
            "type": "double",
            "description": ""
        },
        {
            "name": "Yin",
            "type": "double",
            "dims": [
                "Ncomp"
            ],
            "description": "Mol fractions, Ncomp species"
        },
        {
            "name": "g",
            "type": "double",
            "description": ""
        },
        {
            "name": "R",
            "type": "double",
            "description": ""
        },
        {
            "name": "C1",
            "type": "double",
            "description": ""
        },
        {
            "name": "C2",
            "type": "double",
            "description": ""
        },
        {
            "name": "A0",
            "type": "double",
            "description": ""
        },
        {
            "name": "dg",
            "type": "double",
            "description": ""
        },
        {
            "name": "dp",
            "type": "double",
            "description": ""
        },
        {
            "name": "mug",
            "type": "double",
            "description": ""
        },
        {
            "name": "rhog",
            "type": "double",
            "description": ""
        },
        {
            "name": "P0",
            "type": "double",
            "description": ""
        },
        {
            "name": "Ea",
            "type": "double",
            "description": ""
        },
        {
            "name": "tm",
            "type": "double",
            "description": ""
        },
        {
            "name": "dm",
            "type": "double",
            "description": ""
        },
        {
            "name": "Nm",
            "type": "double",
            "description": ""
        }
    ]
}
```

### `phenom-input.m.js` template file

The template used to generate the Matlab file is given below. This results in a Matlab file that defines one function. This function then populates an object with parameters and returns this.


```js
function par = ReactionParams
    par.Nads = @{soft.model.dim.Nads};
    par.Ncomp = @{soft.model.dim.Ncomp};
    par.Ncomp_T = @{soft.model.dim.Ncomp_T};
    par.Nrx_g = @{soft.model.dim.Nrx_g};
    par.Nrx_s = @{soft.model.dim.Nrx_s};

    par.Ac = @{soft.model.Ac}
    par.ADENT = @{arraySpan(soft.model.ADENT)};
    par.B = @{arraySpan(soft.model.B)};
    par.BET_a0 = @{soft.model.BET_a0};
    par.CP = @{table(soft.model.CP, 4, 6)};
    par.CP_s = @{soft.model.CP_s};
    par.deltaHf = @{arraySpan(soft.model.deltaHf)};
    par.deltaHf_s = @{arraySpan(soft.model.deltaHf_s)};
    par.Dt = @{soft.model.Dt};
    par.E = @{arraySpan(soft.model.E)};
    par.Ea_s = @{arraySpan(soft.model.Ea_s)};
    par.ENT298 = @{arraySpan(soft.model.ENT298)};
    par.F_sol_w = @{soft.model.F_sol_w};
    par.Flowin_w = @{soft.model.Flowin_w};
    par.Fluxin_w = @{soft.model.Fluxin_w};
    par.FRACin = @{arraySpan(soft.model.FRACin)};
    par.FRACin_s = @{arraySpan(soft.model.FRACin_s)};
    par.Fw = @{arraySpan(soft.model.Fw)};
    par.Gs0 = @{soft.model.Gs0};
    par.Heq = @{arraySpan(soft.model.Heq)};
    par.K_0i = @{arraySpan(soft.model.K_0i)};
    par.k_0j = @{arraySpan(soft.model.k_0j)};
    par.k0_s = @{arraySpan(soft.model.k0_s)};
    par.Keq_j = @{arraySpan(soft.model.Keq_j)};
    par.MW = @{arraySpan(soft.model.MW)};
    par.MW_O2 = @{soft.model.MW_O2};
    par.MW_s = @{arraySpan(soft.model.MW_s)};
    par.n_rx = @{arraySpan(soft.model.n_rx)};

    par.Pin = @{soft.model.Pin};
    par.R0_NiAl2O4 = @{soft.model.R0_NiAl2O4};
    par.R0_NiO = @{soft.model.R0_NiO};
    par.rhogm = @{soft.model.rhogm};
    par.rhogmWin = @{soft.model.rhogmWin};
    par.RHOin = @{soft.model.RHOin};
    par.rhos0 = @{soft.model.rhos0};
    par.Smu = @{arraySpan(soft.model.Smu)};
    par.Stoich = @{table(soft.model.Stoich, 6, 4)};
    par.Stoich_s = @{table(soft.model.Stoich_s, 9, 4)};
    par.Tin = @{soft.model.Tin};
    par.Uin = @{soft.model.Uin};
    par.Yin = @{arraySpan(soft.model.Yin)};

    par.Param.g = @{soft.model.g};
    par.Param.R = @{soft.model.R};
    par.Param.C1 = @{soft.model.C1};
    par.Param.C2 = @{soft.model.C2};
    par.Param.A0 = @{soft.model.A0};
    par.Param.dg = @{soft.model.dg};
    par.Param.dp = @{soft.model.dp};
    par.Param.mug = @{soft.model.mug};
    par.Param.rhog = @{soft.model.rhog};

    par.membrane.P0 = @{soft.model.P0};
    par.membrane.Ea = @{soft.model.Ea};
    par.membrane.tm = @{soft.model.tm};
    par.membrane.dm = @{soft.model.dm};
    par.membrane.Nm = @{soft.model.Nm};

    par.Param.memb.P0 = @{soft.model.P0};
    par.Param.memb.Ea = @{soft.model.Ea};
    par.Param.memb.tm = @{soft.model.tm};
    par.Param.memb.dm = @{soft.model.dm};
    par.Param.memb.Nm = @{soft.model.Nm};
end
```
