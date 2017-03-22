"use strict";
// ======================================= CREATE GAME ENGINE ==================
let game = new Phaser.Game(
                           canvas_width,
                           canvas_height,
                           Phaser.AUTO,
                           'schulzzug'
                          );

// add boot and load states                           
game.state.add("boot",boot_state); // starting physics engine and game
game.state.add("load",load_state); // loading all assets
game.state.add("menu",menu_state); // where you can restart the game 

// for all levels in level_names, push the state given in levels.js
for(let i=0; i<number_of_levels; i++)
    game.state.add(level_names[i],level_states[i]);

// this is the final state
game.state.add("end",end_state);

// starting the game
game.state.start("boot");

function fade(in_or_out,callback,transition_duration,state_key) {

    let alpha_start, alpha_end;

    if (in_or_out == null)
        throw "Tell me to either fade 'in' or 'out', null is invalid";
    else if (in_or_out == "in"){
        alpha_start = 1;
        alpha_end = 0;
    } else if (in_or_out == "out"){
        alpha_start = 0;
        alpha_end = 1;
    } else
        throw "Not sure what to do with " + in_or_out;

    if (transition_duration == null) {
        transition_duration = state_transition_duration;
    }

    let rect = game.add.sprite(0,0,"black");
    rect.width = canvas_width;
    rect.height = canvas_height;
    rect.alpha = alpha_start;


    let fade_out = game.add.tween(rect).to(
                                            {
                                                alpha: alpha_end
                                            },
                                            state_transition_duration,
                                            Phaser.Easing.Linear.None
                                          );
    fade_out.onComplete.add( function (){
        if (in_or_out == "out")
            game.state.start(state_key);

        //rect.destroy();
        if (callback !== null)
            callback();
    });

    fade_out.start();
}

function is_mobile() {
    return (is_android || IOS_MODE);
}
