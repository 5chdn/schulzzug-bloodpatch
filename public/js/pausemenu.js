"use strict";
let pause_bg_alpha = 0.5;
let pause_pause_button_alpha = 0.5;
let pause_button_alpha = 1;

let pause_menu = {};

let pause_buttons = [

    { 
        label: "Lass Martin Fahren",
        layer: 0,
        on_click: function () {
            pause_menu_goto_layer(2);
        }
    },
    
    { 
        label: "Spende Schulzcoins",
        layer: 0,
        on_click: function () {
            pause_menu_goto_layer(1);
        }
    },

    { 
        label: "Ton aus/an",
        layer: 0,
        on_click: function () {
            game.sound.mute = !game.sound.mute;
            if (is_mobile()) {
                localStorage.setItem('mute',game.sound.mute); 
            }
        }
    },

    { 
        label: "Weiterfahren",
        layer: 0,
        on_click: hide_pause_menu
    },

    { 
        label: "Ja",
        layer: 2,
        on_click: function () {
            if (coin_counter>0) {
                pause_menu_goto_layer(3);
            } else {
                hide_pause_menu();
                next_level("end");
            }
        }
    },

    { 
        label: "Zurueck",
        layer: 2,
        on_click: function () {
            pause_menu_goto_layer(0);
        }
    },
    { 
        label: "Zurueck",
        layer: 1,
        on_click: function () {
            pause_menu_goto_layer(0);
        }
    },
    { 
        label: "Ich bin geizig",
        layer: 3,
        on_click: function () {
            hide_pause_menu();
            if (!pause_menu.is_coin_menu)
                next_level("end");
        }
    },
    { 
        label: "Ja",
        layer: 4,
        on_click: function () {
            pause_menu_goto_layer(3);
        }
    }

];


let pause_layers = [
    {
        layer_position: 0,
        title: "Pause"
    },
    {
        layer_position: 1,
        title: "Wofuer willst du\ndie Schulzcoins spenden?"
    },
    {
        layer_position: -1,
        title: "Sicher?\n Das beendet das Spiel!"
    },
    {
        layer_position: -2,
        title: "Wofuer moechtest du\ndeine gesammelten\nSchulzcoins ausgeben?"
    },
    {
        layer_position: -3,
        title: "Du hast schon eine Menge\n"+
               "Schulzcoins durch Crashes\n" + 
               "verloren! willst du sie nicht\n"+
               "lieber fuer die Solidar-\n" +
               "gemeinschaft ausgeben?\n"
    }

];

pause_menu.button_layer_count = pause_layers.length;

let pause_style = {
            align:"center",
            font:'20px SilkScreen monospace',
            fill: 'white'
        }

function create_pause_menu () {

    pause_menu.pause_button = game.add.button(20,20,"pause_button",
                                 function() {
                                     show_pause_menu();
                                 },
                                 this);
    let p_button_scale = 48/ pause_menu.pause_button.width;
    pause_menu.pause_button.scale.setTo(p_button_scale);
    pause_menu.pause_button.alpha = 0;
    pause_menu.pause_button.inputEnabled = false;

    pause_menu.is_active = false;
    pause_menu.is_coin_menu = false;

    pause_menu.rect = game.add.sprite(0,0,"black");
    pause_menu.rect.width = canvas_width;
    pause_menu.rect.height = canvas_height-panel.height;
    pause_menu.rect.alpha = 0;

    pause_menu.layer_titles = Array();
    pause_menu.buttons = Array();
    pause_menu.button_labels = Array();

    pause_menu.current_layer = 0;

    for(let layer=0; layer<pause_menu.button_layer_count; layer++){
        let pos = pause_layers[layer].layer_position;
        let x = canvas_width*(pos+1/2);
        let y = canvas_height/6;
        let layer_label = game.add.text(x,y,pause_layers[layer].title,pause_style);
        layer_label.anchor.setTo(0.5,0.5);
        layer_label.font = 'SilkScreen';
        layer_label.alpha = 0;

        pause_menu.layer_titles.push(layer_label);
        y += canvas_height/6;
        let dy = canvas_height/10;
        let button_count = 0;
        for(let iButton=0; iButton<pause_buttons.length; iButton++) {
            if (pause_buttons[iButton].layer == layer)
            {
                let by = y + dy* button_count;
                let button = game.add.button(x,by,"button",
                                             pause_buttons[iButton].on_click,
                                             this,1,1,0,1);
                let button_scale = canvas_width*0.8/ button.width;
                let button_label = game.add.text(x,by,pause_buttons[iButton].label,pause_style);
                button_label.font = 'SilkScreen';
                button_label.anchor.setTo(0.5,0.5);
                button_label.alpha = 0;
                button.alpha = 0;
                button.anchor.setTo(0.5,0.5);
                //button.width *= button_scale;
                //button.height = dy;
                button.scale.setTo(button_scale,button_scale);
                button.inputEnabled = false;
                pause_menu.buttons.push(button);
                pause_menu.button_labels.push(button_label);
                button_count++;
            }
        }
    }
}

function destroy_pause_menu () {
    if (pause_menu.hasOwnProperty("rect")) {
        pause_menu.rect.destroy();
        pause_menu.layer_titles.forEach(function(d) { d.destroy(); });
        pause_menu.button_labels.forEach(function(d) { d.destroy(); });
        pause_menu.buttons.forEach(function(d) { d.destroy() });
        pause_menu.is_active = false;
        pause_menu.pause_button.destroy();
    }
}

function pause_menu_goto_layer(layer,layer_change_duration) {

    // if it is not null, then the event does not come from a menu internal event.
    // if it is null, use the standard transition duration 
    if (layer_change_duration == null)
        layer_change_duration = 1000;
    else if (layer_change_duration == 1) {
    }


    if ((layer == 1 || layer == 3) && !used_coin_menu_already) {
        //coin_notifier.animations.play("disappear");
        used_coin_menu_already = true;
        localStorage.setItem('used_coin_menu_already',true);
    }

    let dlayer =   pause_layers[pause_menu.current_layer].layer_position
                 - pause_layers[layer].layer_position;

    let arrs = [ 
                pause_menu.layer_titles,
                pause_menu.button_labels,
                pause_menu.buttons
              ];

     arrs.forEach( function (arr) {
         arr.forEach( function (obj) {
             if (layer_change_duration == 1){
                 obj.x = obj.x + dlayer * canvas_width;
             }else {
                 let tween = game.add.tween(obj).to({ x: obj.x + dlayer * canvas_width},
                                                    layer_change_duration,
                                                    Phaser.Easing.Cubic.InOut
                                                   );
                 tween.start();
             }
         });
     });

     pause_menu.current_layer = layer;

}

function show_pause_menu() {
    pause_menu_goto_layer(0,1);
    pause_menu.rect.alpha = pause_bg_alpha;
    pause_menu.layer_titles.forEach(function(d) { d.alpha = 1; });
    pause_menu.button_labels.forEach(function(d) { d.alpha = 1; });
    pause_menu.buttons.forEach(function(d) { d.alpha = 1; d.inputEnabled = true; });
    pause_menu.is_active = true;
    game.tweens.pauseAll();
    pause_menu.pause_button.alpha = 0;
    pause_menu.pause_button.inputEnabled = false;
    pause_menu.is_coin_menu = false;
}

function hide_pause_menu() {
    pause_menu.rect.alpha = 0;
    pause_menu.layer_titles.forEach(function(d) { d.alpha = 0; });
    pause_menu.button_labels.forEach(function(d) { d.alpha = 0; });
    pause_menu.buttons.forEach(function(d) { d.alpha = 0; d.inputEnabled = false; });
    pause_menu.is_active = false;
    game.tweens.resumeAll();
    pause_menu.pause_button.alpha = pause_pause_button_alpha;
    pause_menu.pause_button.inputEnabled = true;
    //pause_menu.is_coin_menu = false;
}

function show_coin_menu() {
    pause_menu_goto_layer(3,1);
    pause_menu.is_coin_menu = true;
    pause_menu.rect.alpha = pause_bg_alpha;
    pause_menu.layer_titles.forEach(function(d) { d.alpha = 1; });
    pause_menu.button_labels.forEach(function(d) { d.alpha = 1; });
    pause_menu.buttons.forEach(function(d) { d.alpha = 1; d.inputEnabled = true; });
    pause_menu.is_active = true;
    game.tweens.pauseAll();
    pause_menu.pause_button.alpha = 0;
    pause_menu.pause_button.inputEnabled = false;
}

function show_coin_notifier() {
    pause_menu_goto_layer(4,1);
    pause_menu.is_coin_menu = true;
    pause_menu.rect.alpha = pause_bg_alpha;
    pause_menu.layer_titles.forEach(function(d) { d.alpha = 1; });
    pause_menu.button_labels.forEach(function(d) { d.alpha = 1; });
    pause_menu.buttons.forEach(function(d) { d.alpha = 1; d.inputEnabled = true; });
    pause_menu.is_active = true;
    game.tweens.pauseAll();
    pause_menu.pause_button.alpha = 0;
    pause_menu.pause_button.inputEnabled = false;
}

function activate_pause_button() {
    pause_menu.pause_button.alpha = pause_pause_button_alpha;
    pause_menu.pause_button.inputEnabled = true;
}

function create_spend_buttons () {
    
    let options = get_coin_spending_options_from_firebird();

    for(let i=0; i<options.length; i++) {
        let key = options[i].key;
        pause_buttons.push({
            label: options[i].name,
            layer: 1,
            on_click: function() {
                if (coin_counter>0)
                    sound_tada.play();
                update_coin_counter(-coin_counter);
                firebase_send_coins(key,coin_counter);
            }
        });
        pause_buttons.push({
            label: options[i].name,
            layer: 3,
            on_click: function() {
                if (coin_counter>0)
                    sound_tada.play();
                update_coin_counter(-coin_counter);
                firebase_send_coins(key,coin_counter);
                hide_pause_menu();
                if (!pause_menu.is_coin_menu)
                    next_level("end");
            }
        });
    }
}
