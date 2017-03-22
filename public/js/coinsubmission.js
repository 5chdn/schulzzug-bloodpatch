"use strict";

// this is a dummy. get options from firebase
let default_coin_spending_options = [
        { 
            name: "Bildung",
            key: "34sve5ubd6" // those are fake keys.
        }, 
        { 
            name: "Europaeische Union",
            key: "sb4795n"
        }, 
        { 
            name: "Krankenversicherung",
            key: "h6876og"
        }, 
        { 
            name: "Rentenversicherung",
            key: "voiur5c0"
        } 
    ];


function get_coin_spending_options_from_firebird() {

    let is_connected = false; // This has to be checked

    if (!is_connected) {
        return default_coin_spending_options;
    } else {
        // insert firebase code here
    }
}

function firebase_send_coins(key,coins) {

    // add the coins to the entry with key `key` into the firebase database
    // insert code her
}
