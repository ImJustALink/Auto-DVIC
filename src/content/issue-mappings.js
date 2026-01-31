(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.AutoDVIC_Mappings = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const issueMapping = {
        // Front Side
        // Lights and light covers
        "1_lights_1": "Hazard light is not working",
        "1_lights_2": "Headlight is not working",
        "1_lights_3": "Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",
        // Suspension & underbody shield
        "1_susp_1": "Loose or hanging objects underneath",
        "1_susp_2": "Noticeable leaning of vehicle (when parked)",
        // Body and doors
        "1_body_1": "Items attached to the body of the vehicle (for example: bumpers and hood latches) are missing, damaged, loose, unsecure, hanging, or held with a zip-tie, tape, or similar",
        // EV system
        "1_ev_1": "Orange wires are present: High Voltage! Do not touch!",

        // Passenger Side
        // Side mirrors
        "2_mirror_1": "Side mirror glass is cracked, damaged, or missing",
        "2_mirror_2": "Side mirrors are loose, hanging, unsecured, or held up with a zip-tie, tape, or similar",
        "2_mirror_3": "Side mirrors cannot be adjusted",
        // Front tire, wheel and rim
        "2_ftire_3": "Tire has objects, cuts, dents, swells, leaks, appears flat, or exposed wire on surface",
        "2_ftire_4": "Wheel, wheel nuts, rim, or mounting equipment is damaged, cracked, loose, missing, or broken",
        "2_ftire_1": "Tire has insufficient tread (Less than 2/32 or 1.6mm) on inner most, middle, or outer most tread",
        "2_ftire_2": "Tire has insufficient tread (Less than 4/32 or 3.2mm) on inner most, middle, or outer most tread",
        // Back tire, wheel and rim
        "2_btire_1": "Tire has insufficient tread (Less than 2/32 or 1.6mm) on inner most, middle, or outer most tread",
        "2_btire_2": "Tire has objects, cuts, dents, swells, leaks, appears flat, or exposed wire on surface",
        "2_btire_3": "Wheel, wheel nuts, rim, or mounting equipment is damaged, cracked, loose, missing, or broken",
        "2_btire_4": "Mud Flap is damaged, missing, unsecured or held up with a zip-tie, tape or similar",
        // Body and doors
        "2_body_1": "Items attached to the body of the vehicle (for example: side view camera or cargo steps) are missing, damaged, loose, unsecure, hanging, or held with a zip-tie, tape, or similar",
        "2_body_3": "Prime decal is damaged, missing, excessively dirty, or not visible",
        "2_body_2": "Amazon DOT decal (USDOT2881058) is damaged, missing, excessively dirty, or not visible, or any existing DOT decals on rental vehicles are not covered and visible",
        // Suspension & underbody shield
        "2_susp_1": "Loose or hanging objects underneath",
        // EV system
        "2_ev_1": "Orange wires are present: High Voltage! Do not touch!",
        // Lights and light covers
        "2_lights_1": "Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",

        // Back Side
        // License plates/tags
        "3_lic_1": "License plates/temp tags are damaged, missing, illegible, or expired",
        // Lights and light covers
        "3_lights_1": "Hazard light is not working",
        "3_lights_2": "License plate light is not working",
        "3_lights_4": "Tail light is not working",
        "3_lights_3": "Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",
        // Suspension & underbody shield
        "3_susp_1": "Loose or hanging objects underneath",
        // EV system
        "3_ev_1": "Orange wires are present: High Voltage! Do not touch!",
        // Body and doors
        "3_body_1": "Items attached to the body of the vehicle (for example: bumper, back-up camera, or rear step) are missing, damaged, loose, unsecure, hanging, or held with a zip-tie, tape, or similar",

        // Driver Side
        // Back tire, wheel and rim
        "4_btire_1": "Tire has insufficient tread (Less than 2/32 or 1.6mm) on inner most, middle, or outer most tread",
        "4_btire_2": "Tire has objects, cuts, dents, swells, leaks, appears flat, or exposed wire on surface",
        "4_btire_3": "Wheel, wheel nuts, rim, or mounting equipment is damaged, cracked, loose, missing, or broken",
        "4_btire_4": "Mud Flap is damaged, missing, unsecured or held up with a zip-tie, tape or similar",
        // Suspension & underbody shield
        "4_susp_1": "Active non-clear fluid leaking on the ground",
        "4_susp_2": "Loose or hanging objects underneath",
        // Front tire, wheel and rim
        "4_tire_3": "Tire has objects, cuts, dents, swells, leaks, appears flat, or exposed wire on surface",
        "4_tire_4": "Wheel, wheel nuts, rim, or mounting equipment is damaged, cracked, loose, missing, or broken",
        "4_tire_1": "Tire has insufficient tread (Less than 2/32 or 1.6mm) on inner most, middle, or outer most tread",
        "4_tire_2": "Tire has insufficient tread (Less than 4/32 or 3.2mm) on inner most, middle, or outer most tread",
        // Side mirrors
        "4_mirror_1": "Side mirror or window glass is cracked, damaged, or missing",
        "4_mirror_2": "Side mirrors are loose, hanging, unsecured, or held up with a zip-tie, tape, or similar",
        "4_mirror_3": "Side mirrors cannot be adjusted",
        // EV system
        "4_ev_1": "Orange wires are present: High Voltage! Do not touch!",
        // Body and doors
        "4_ev_2": "Charging port cap is missing or broken",
        "4_body_1": "Items attached to the body of the vehicle (for example: side view camera or cargo steps) are missing, damaged, loose, unsecure, hanging, or held with a zip-tie, tape, or similar",
        "4_body_3": "Prime decal is damaged, missing, excessively dirty, or not visible",
        "4_body_2": "Amazon DOT decal (USDOT2881058) is damaged, missing, excessively dirty, or not visible, or any existing DOT decals on rental vehicles are not covered and visible",
        // Charging port and fluids
        "4_susp_3": "Fuel cap is missing or broken",
        // Lights and light covers
        "4_lights_1": "Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",

        // In Cab
        // Body and doors
        "5_body_2": "Interior sliding door (bulkhead doors) cannot open or close",
        "5_body_3": "Items attached to the body of the vehicle (for example: shelves, floor panels) are missing, damaged, loose, unsecure, hanging, or held with a zip-tie, tape, or similar",
        "5_body_1": "One or more exterior doors (driver, passenger, cargo, or back door) cannot open, close, lock, or unlock properly from the inside of the vehicle",
        // Camera/monitor
        "5_cam_1": "Netradyne camera is hanging/disconnected from bracket",
        "5_cam_2": "Rear or side camera monitor is missing, broken, unsecure, obstructed, or not working",
        "5_cam_3": "Sensors or cameras are dirty, or a warning light/message is present signaling an issue on the dashboard",
        // Lights and light covers
        "5_lights_4": "Hazard light is not working",
        "5_lights_5": "Turn signal is not working",
        "5_lights_1": "Any red warning lights/lamps are on or flashing",
        "5_lights_3": "Dashboard light is not working",
        "5_lights_2": "Any yellow warning lights/lamps are on or flashing",
        // Safety accessories
        "5_safety_1": "Delivery device cradle is damaged, missing, or is mounted with a tape, zip-tie or similar",
        "5_safety_4": "Device is not able to be stowed behind dashboard without becoming loose and no device mount is present",
        "5_safety_5": "Driver display/center display is blank or not functioning",
        "5_safety_3": "Fire extinguisher is missing, not mounted, mounted with a tape, zip-tie or similar, or the dial/needle is not in the green zone",
        // Windshield
        "5_windsh_1": "Any crack, chip, stars on the windshield >1/2 inch (excluding 1 inch boarder of windshield)",
        "5_windsh_2": "Device/Accessory is mounted on the windshield",
        // Wipers
        "5_wipers_2": "Wiper blades are missing, damaged, or not working",
        "5_wipers_1": "Windshield washer system/wiper fluid reservoir is not working",
        // Brakes
        "5_brakes_1": "Foot brake is grinding, vibrates, leaking air, or not working",
        "5_brakes_2": "Foot brake is squeaking, loose, weak, or stiff",
        "5_brakes_4": "Parking brake is loose, weak, or stiff",
        "5_brakes_3": "Parking brake is not working",
        "5_brakes_5": "Air pressure gauge read less than 79 lb./in2 (5.5 kg/cm2)",
        // HVAC systems
        "5_hvac_2": "Defroster/heater is not working",
        "5_hvac_1": "AC is not blowing cold air",
        // Steering, seatbelt, horn and alarm
        "5_sha_1": "Horn, backup alarm, or seatbelt alarm is not working",
        "5_sha_2": "Seatbelt is missing, torn, frayed, or not working",
        "5_sha_3": "Steering wheel has excessive vibration",
        "5_sha_4": "Steering wheel is stiff, loose, or needs alignment",
        "5_sha_5": "AVAS noise does not sound when vehicle travels under 12 mph",

        // General
        // Vehicle Documentation
        "5_docu_1": "DOT/CA BIT/State Inspection sticker is missing, damaged, illegible, or expired",
        "5_docu_2": "Insurance information, registration, short haul exemption, or certification of lease is missing, damaged, illegible, or expired",
        // Safety accessories
        "5_safety_2": "Spare fuses or reflective triangles are missing",
        // Vehicle Cleanliness
        "5_clean_1": "Interior of vehicle has excessive grime, odor, dust, or trash present"
    };

    const categoryMapping = {
        // Front Side
        "1_lights_1": {
            category: "Front Side",
            subcategory: "Lights and light covers"
        },
        "1_lights_2": {
            category: "Front Side",
            subcategory: "Lights and light covers"
        },
        "1_lights_3": {
            category: "Front Side",
            subcategory: "Lights and light covers"
        },
        "1_susp_1": {
            category: "Front Side",
            subcategory: "Suspension & underbody shield"
        },
        "1_susp_2": {
            category: "Front Side",
            subcategory: "Suspension & underbody shield"
        },
        "1_body_1": {
            category: "Front Side",
            subcategory: "Body and doors"
        },
        "1_ev_1": {
            category: "Front Side",
            subcategory: "EV system"
        },

        // Passenger Side
        "2_mirror_1": {
            category: "Passenger Side",
            subcategory: "Side mirrors"
        },
        "2_mirror_2": {
            category: "Passenger Side",
            subcategory: "Side mirrors"
        },
        "2_mirror_3": {
            category: "Passenger Side",
            subcategory: "Side mirrors"
        },
        "2_ftire_1": {
            category: "Passenger Side",
            subcategory: "Front tire, wheel and rim"
        },
        "2_ftire_2": {
            category: "Passenger Side",
            subcategory: "Front tire, wheel and rim"
        },
        "2_ftire_3": {
            category: "Passenger Side",
            subcategory: "Front tire, wheel and rim"
        },
        "2_ftire_4": {
            category: "Passenger Side",
            subcategory: "Front tire, wheel and rim"
        },
        "2_btire_1": {
            category: "Passenger Side",
            subcategory: "Back tire, wheel and rim"
        },
        "2_btire_2": {
            category: "Passenger Side",
            subcategory: "Back tire, wheel and rim"
        },
        "2_btire_3": {
            category: "Passenger Side",
            subcategory: "Back tire, wheel and rim"
        },
        "2_btire_4": {
            category: "Passenger Side",
            subcategory: "Back tire, wheel and rim"
        },
        "2_body_1": {
            category: "Passenger Side",
            subcategory: "Body and doors"
        },
        "2_body_2": {
            category: "Passenger Side",
            subcategory: "Body and doors"
        },
        "2_body_3": {
            category: "Passenger Side",
            subcategory: "Body and doors"
        },
        "2_susp_1": {
            category: "Passenger Side",
            subcategory: "Suspension & underbody shield"
        },
        "2_ev_1": {
            category: "Passenger Side",
            subcategory: "EV system"
        },
        "2_lights_1": {
            category: "Passenger Side",
            subcategory: "Lights and light covers"
        },

        // Back Side
        "3_lic_1": {
            category: "Back Side",
            subcategory: "License plates/tags"
        },
        "3_lights_1": {
            category: "Back Side",
            subcategory: "Lights and light covers"
        },
        "3_lights_2": {
            category: "Back Side",
            subcategory: "Lights and light covers"
        },
        "3_lights_3": {
            category: "Back Side",
            subcategory: "Lights and light covers"
        },
        "3_lights_4": {
            category: "Back Side",
            subcategory: "Lights and light covers"
        },
        "3_susp_1": {
            category: "Back Side",
            subcategory: "Suspension & underbody shield"
        },
        "3_ev_1": {
            category: "Back Side",
            subcategory: "EV system"
        },
        "3_body_1": {
            category: "Back Side",
            subcategory: "Body and doors"
        },

        // Driver Side
        "4_btire_1": {
            category: "Driver Side",
            subcategory: "Back tire, wheel and rim"
        },
        "4_btire_2": {
            category: "Driver Side",
            subcategory: "Back tire, wheel and rim"
        },
        "4_btire_3": {
            category: "Driver Side",
            subcategory: "Back tire, wheel and rim"
        },
        "4_btire_4": {
            category: "Driver Side",
            subcategory: "Back tire, wheel and rim"
        },
        "4_susp_1": {
            category: "Driver Side",
            subcategory: "Suspension & underbody shield"
        },
        "4_susp_2": {
            category: "Driver Side",
            subcategory: "Suspension & underbody shield"
        },
        "4_tire_1": {
            category: "Driver Side",
            subcategory: "Front tire, wheel and rim"
        },
        "4_tire_2": {
            category: "Driver Side",
            subcategory: "Front tire, wheel and rim"
        },
        "4_tire_3": {
            category: "Driver Side",
            subcategory: "Front tire, wheel and rim"
        },
        "4_tire_4": {
            category: "Driver Side",
            subcategory: "Front tire, wheel and rim"
        },
        "4_mirror_1": {
            category: "Driver Side",
            subcategory: "Side mirrors"
        },
        "4_mirror_2": {
            category: "Driver Side",
            subcategory: "Side mirrors"
        },
        "4_mirror_3": {
            category: "Driver Side",
            subcategory: "Side mirrors"
        },
        "4_ev_1": {
            category: "Driver Side",
            subcategory: "EV system"
        },
        "4_ev_2": {
            category: "Driver Side",
            subcategory: "Charging port and fluids"
        },
        "4_body_1": {
            category: "Driver Side",
            subcategory: "Body and doors"
        },
        "4_body_2": {
            category: "Driver Side",
            subcategory: "Body and doors"
        },
        "4_body_3": {
            category: "Driver Side",
            subcategory: "Body and doors"
        },
        "4_susp_3": {
            category: "Driver Side",
            subcategory: "Charging port and fluids"
        },
        "4_lights_1": {
            category: "Driver Side",
            subcategory: "Lights and light covers"
        },

        // In Cab
        "5_body_1": {
            category: "In Cab",
            subcategory: "Body and doors"
        },
        "5_body_2": {
            category: "In Cab",
            subcategory: "Body and doors"
        },
        "5_body_3": {
            category: "In Cab",
            subcategory: "Body and doors"
        },
        "5_cam_1": {
            category: "In Cab",
            subcategory: "Camera/monitor"
        },
        "5_cam_2": {
            category: "In Cab",
            subcategory: "Camera/monitor"
        },
        "5_cam_3": {
            category: "In Cab",
            subcategory: "Camera/monitor"
        },
        "5_lights_1": {
            category: "In Cab",
            subcategory: "Lights and light covers"
        },
        "5_lights_2": {
            category: "In Cab",
            subcategory: "Lights and light covers"
        },
        "5_lights_3": {
            category: "In Cab",
            subcategory: "Lights and light covers"
        },
        "5_lights_4": {
            category: "In Cab",
            subcategory: "Lights and light covers"
        },
        "5_lights_5": {
            category: "In Cab",
            subcategory: "Lights and light covers"
        },
        "5_safety_1": {
            category: "In Cab",
            subcategory: "Safety accessories"
        },
        "5_safety_2": {
            category: "General",
            subcategory: "Safety accessories"
        },
        "5_safety_3": {
            category: "In Cab",
            subcategory: "Safety accessories"
        },
        "5_safety_4": {
            category: "In Cab",
            subcategory: "Safety accessories"
        },
        "5_safety_5": {
            category: "In Cab",
            subcategory: "Safety accessories"
        },
        "5_windsh_1": {
            category: "In Cab",
            subcategory: "Windshield"
        },
        "5_windsh_2": {
            category: "In Cab",
            subcategory: "Windshield"
        },
        "5_wipers_1": {
            category: "In Cab",
            subcategory: "Wipers"
        },
        "5_wipers_2": {
            category: "In Cab",
            subcategory: "Wipers"
        },
        "5_brakes_1": {
            category: "In Cab",
            subcategory: "Brakes"
        },
        "5_brakes_2": {
            category: "In Cab",
            subcategory: "Brakes"
        },
        "5_brakes_3": {
            category: "In Cab",
            subcategory: "Brakes"
        },
        "5_brakes_4": {
            category: "In Cab",
            subcategory: "Brakes"
        },
        "5_brakes_5": {
            category: "In Cab",
            subcategory: "Brakes"
        },
        "5_hvac_1": {
            category: "In Cab",
            subcategory: "HVAC systems"
        },
        "5_hvac_2": {
            category: "In Cab",
            subcategory: "HVAC systems"
        },
        "5_sha_1": {
            category: "In Cab",
            subcategory: "Steering, seatbelt, horn and alarm"
        },
        "5_sha_2": {
            category: "In Cab",
            subcategory: "Steering, seatbelt, horn and alarm"
        },
        "5_sha_3": {
            category: "In Cab",
            subcategory: "Steering, seatbelt, horn and alarm"
        },
        "5_sha_4": {
            category: "In Cab",
            subcategory: "Steering, seatbelt, horn and alarm"
        },
        "5_sha_5": {
            category: "In Cab",
            subcategory: "Steering, seatbelt, horn and alarm"
        },
        "5_docu_1": {
            category: "General",
            subcategory: "Vehicle Documentation"
        },
        "5_docu_2": {
            category: "General",
            subcategory: "Vehicle Documentation"
        },
        "5_clean_1": {
            category: "General",
            subcategory: "Vehicle Cleanliness"
        }
    };

    return {
        issueMapping,
        categoryMapping
    };
}));
