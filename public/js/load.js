"use strict";
// the load state
//
let started_loading_time;
const min_load_time = 1000;

let load_state = {

    // add loading label to the black screen
    preload: function () {
        let style = {
            align:"center",
            font:"30px SilkScreen monospace",
            fill: 'white'
        }
        let loading_label = game.add.text(canvas_width/2, canvas_height*(1-1/5),'lading...',style) ;
        loading_label.font = 'SilkScreen';
        loading_label.anchor.setTo(0.5,0.5);

        let logo = game.add.sprite(canvas_width/2, canvas_height/3,"logo");
        let logo_scale =  canvas_width / logo.width;
        logo.anchor.setTo(0.5,0.5);
        logo.scale.setTo(logo_scale,logo_scale);
        logo.angle = 30;

        started_loading_time = game.time.now;

        //for the pause menu, load the data from the server and create the buttons
        create_spend_buttons();

        // load all assets
        preload_all_assets();


    },

    update: function () {
        let current_time_at_loading = game.time.now;
        if (current_time_at_loading - min_load_time > started_loading_time){
            fade("out",null,state_transition_duration/2,"menu");
        }
    }

}



function preload_all_assets() {


    game.load.image("black", "assets/black.png");

    if(is_retina()) {
        game.load.image('grass_de',      'assets/green.png');
        game.load.image('dirt_de',       'assets/dirt.png');
        game.load.image('sky_de',        'assets/sky.png');

        game.load.image('grass_us',      'assets/usa/green_USA.png');
        game.load.image('dirt_us',       'assets/usa/dirt_USA.png');
        game.load.image('sky_us',        'assets/usa/sky_USA.png');

        game.load.image('grass_tr',      'assets/turkey/green_TUR.png');
        game.load.image('dirt_tr',       'assets/turkey/dirt_TUR.png');
        game.load.image('sky_tr',        'assets/turkey/sky_TUR.png');

        game.load.image('grass_nl',      'assets/netherlands/green_NED.png');
        game.load.image('dirt_nl',       'assets/netherlands/dirt_NED.png');
        game.load.image('sky_nl',        'assets/netherlands/sky_NED.png');

        game.load.image('grass_ru',      'assets/russia/green_RUS.png');
        game.load.image('dirt_ru',       'assets/russia/dirt_RUS.png');
        game.load.image('sky_ru',        'assets/russia/sky_RUS.png');

        game.load.image('panel',      'assets/Panel.png');
        game.load.image('menubg',     'assets/untergrund.png');
        game.load.image("byebye","assets/Twitter.png");
        game.load.image('pause_button',  'assets/pause_button.png');

        game.load.image('cloud0',     'assets/cloud01.png');
        game.load.image('cloud1',     'assets/cloud02.png');
        game.load.image('cloud2',     'assets/cloud03.png');

        game.load.image('wall_franka','assets/germany/Franka-wall.png');
        game.load.image('wall_dagobert','assets/usa/Dagobert-Wall.png');
        game.load.image('wall_rezzep','assets/turkey/Rezzep_wall.png');
        game.load.image('wall_gerd','assets/netherlands/Gerd_wall.png');
        game.load.image('franka',     'assets/germany/Franka.png');
        game.load.image('dagobert',     'assets/usa/Dagobert.png');
        game.load.image('wall',       'assets/wall.png');
        game.load.image('rezzep',    'assets/turkey/Rezzep.png');
        game.load.image('mirovich',      'assets/russia/Mirovich_bear.png');
        game.load.image('gerd',      'assets/netherlands/Gerd.png');

        game.load.image('tree0',      'assets/Tree01.png');
        game.load.image('tree1',      'assets/Tree02.png');
        game.load.image('tree2',      'assets/specialtree.png');
        game.load.image('tree3',      'assets/russia/Tree03.png');
        game.load.image('office',     'assets/Kanzleramt.png');
        game.load.image('bush',       'assets/Bush01.png');
        game.load.image('sign',       'assets/Sign01.png');
        game.load.image('tumbleweed', 'assets/usa/Tumbleweed.png');
        game.load.image('cactus0',    'assets/usa/cactus01.png');
        game.load.image('cactus1',    'assets/usa/cactus02.png');
        game.load.image('olivetree',  'assets/turkey/Olive.png');
        game.load.image('goat',       'assets/turkey/Goat.png');
        game.load.image('tulips',     'assets/netherlands/Tulips.png');
        game.load.image('gate',       'assets/gate.50.png');

        game.load.spritesheet(
                              'rails',
                              'assets/rails_animation.png',
                              750, 919
                              );
        game.load.spritesheet(
                              'eurostar',
                              'assets/star_animation.png',
                              60,64
                              );

        game.load.spritesheet('train', 'assets/Trains_animation.50.png', 120, 232);
        game.load.spritesheet('coin', 'assets/Coin.png', 64, 64);
        game.load.spritesheet('button', 'assets/button.png', 575*2, 144*2);
        game.load.spritesheet('coin_notifier', 'assets/coin_notifier.png', 180*2, 100*2);

    } else {
        game.load.image('grass_de',      'assets/green.50.png');
        game.load.image('dirt_de',       'assets/dirt.50.png');
        game.load.image('sky_de',        'assets/sky.50.png');

        game.load.image('grass_us',   'assets/usa/green_USA.50.png');
        game.load.image('dirt_us',    'assets/usa/dirt_USA.50.png');
        game.load.image('sky_us',     'assets/usa/sky_USA.50.png');

        game.load.image('grass_tr',      'assets/turkey/green_TUR.50.png');
        game.load.image('dirt_tr',       'assets/turkey/dirt_TUR.50.png');
        game.load.image('sky_tr',        'assets/turkey/sky_TUR.50.png');

        game.load.image('grass_nl',      'assets/netherlands/green_NED.50.png');
        game.load.image('dirt_nl',       'assets/netherlands/dirt_NED.50.png');
        game.load.image('sky_nl',        'assets/netherlands/sky_NED.50.png');

        game.load.image('grass_ru',      'assets/russia/green_RUS.50.png');
        game.load.image('dirt_ru',       'assets/russia/dirt_RUS.50.png');
        game.load.image('sky_ru',        'assets/russia/sky_RUS.50.png');

        game.load.image('panel',      'assets/Panel.50.png');
        game.load.image('menubg',     'assets/untergrund.50.png');
        game.load.image("byebye","assets/Twitter.50.png");
        game.load.image('pause_button',  'assets/pause_button.50.png');

        game.load.image('cloud0',     'assets/cloud01.50.png');
        game.load.image('cloud1',     'assets/cloud02.50.png');
        game.load.image('cloud2',     'assets/cloud03.50.png');

        game.load.image('wall_franka','assets/germany/Franka-wall.50.png');
        game.load.image('wall_dagobert','assets/usa/Dagobert-Wall.50.png');
        game.load.image('wall_rezzep','assets/turkey/Rezzep_wall.50.png');
        game.load.image('wall_gerd','assets/netherlands/Gerd_wall.50.png');
        game.load.image('franka',     'assets/germany/Franka.png');
        game.load.image('dagobert',     'assets/usa/Dagobert.png');
        game.load.image('rezzep',    'assets/turkey/Rezzep.50.png');
        game.load.image('gerd',      'assets/netherlands/Gerd.50.png');
        game.load.image('mirovich',      'assets/russia/Mirovich_bear.50.png');
        game.load.image('wall',       'assets/wall.png');
        game.load.image('gate',       'assets/gate.png');

        game.load.image('tree0',      'assets/Tree01.50.png');
        game.load.image('tree1',      'assets/Tree02.50.png');
        game.load.image('tree2',      'assets/specialtree.50.png');
        game.load.image('tree3',      'assets/russia/Tree03.50.png');
        game.load.image('office',     'assets/Kanzleramt.50.png');
        game.load.image('bush',       'assets/Bush01.50.png');
        game.load.image('sign',       'assets/Sign01.50.png');
        game.load.image('tumbleweed', 'assets/usa/Tumbleweed.50.png');
        game.load.image('cactus0',    'assets/usa/cactus01.50.png');
        game.load.image('cactus1',    'assets/usa/cactus02.50.png');
        game.load.image('olivetree',  'assets/turkey/Olive.50.png');
        game.load.image('goat',       'assets/turkey/Goat.50.png');
        game.load.image('tulips',     'assets/netherlands/Tulips.50.png');

        game.load.spritesheet(
                              'rails',
                              'assets/rails_animation.50.png',
                              375, 460
                              );
        game.load.spritesheet(
                              'eurostar',
                              'assets/star_animation.png',
                              60,64
                              );

        game.load.spritesheet('train', 'assets/Trains_animation.50.png', 120, 232);
        game.load.spritesheet('coin', 'assets/Coin.50.png', 32, 32);
        game.load.spritesheet('button', 'assets/button.50.png', 288*2, 72*2);
        game.load.spritesheet('coin_notifier', 'assets/coin_notifier.50.png', 180, 100);

    }

    game.load.audio('jump',   [
                               'sounds/jump.mp3',
                               'sounds/jump.ogg',
                               'sounds/jump.wav'
                               ]);
    game.load.audio('bling',  [
                               'sounds/coin.mp3',
                               'sounds/coin.ogg',
                               'sounds/coin.wav'
                               ]);
    game.load.audio('smash',  [
                               'sounds/wall_smash.mp3',
                               'sounds/wall_smash.ogg',
                               'sounds/wall_smash.wav'
                               ]);
    game.load.audio('star',  [
                              'sounds/bg_EU.mp3',
                              'sounds/bg_EU.ogg',
                              'sounds/bg_EU.wav'
                              ]);
    game.load.audio('tada',   [
                               'sounds/tada.mp3',
                               'sounds/tada.ogg',
                               'sounds/tada.wav'
                               ]);
    game.load.audio('ratter', [
                               'sounds/ratter.mp3',
                               'sounds/ratter.ogg',
                               'sounds/ratter.wav'
                               ]);
    game.load.audio('whistle', [
                                'sounds/whistle.mp3',
                                'sounds/whistle.ogg',
                                'sounds/whistle.wav'
                                ]);
    game.load.audio('bg_music', [
                                'sounds/die_internationale_8bit_simple_loop.mp3',
                                'sounds/die_internationale_8bit_simple_loop.ogg'
                                ]);
    game.load.audio('bg_menu', [
                                'sounds/menu_loop.mp3',
                                'sounds/menu_loop.ogg'
                                ]);
}
function is_retina() {
    let query = "(-webkit-min-device-pixel-ratio: 2), "
    + "(min-device-pixel-ratio: 2), "
    + "(min-resolution: 192dpi)";

    if (matchMedia(query).matches) {
        return true;
    } else {
        // do non high-dpi stuff
    }
    return false;
    //return false;
}

