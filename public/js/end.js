"use strict";
let end_state = {

    create: function () {
        let style = {
            align:"center",
            font:'30px SilkScreen monospace',
            fill: 'white'
        }

        sound_background.stop();
        sound_eu_star.stop();
        sound_bg_music.stop();

        let byebye = game.add.sprite(0,0,"byebye");
        let byebye_scale = canvas_width / byebye.width;
        byebye.scale.setTo(byebye_scale,byebye_scale);
        let remaining_space = canvas_height - byebye.height;
        let ende_label = game.add.text(canvas_width/2, 
                                       canvas_height - 0.5*remaining_space,
                                       'Danke fuer deine \n Hilfe, Genoss*in!\n Von hier ueber-\nnehme ich wieder.\nGlueck auf!',
                                       style) ;
        ende_label.font = 'SilkScreen';
        ende_label.anchor.setTo(0.5,0.5);

        function go_back() {
            fade("out", 
                 function () {
                    game.input.onDown.add( function (){}, this);
                    game.input.keyboard.onDownCallback = function(){};
                 },
                 null,
                 "menu")
        }

        fade("in", function () {
            game.input.onDown.add( go_back, this);
            game.input.keyboard.onDownCallback = go_back;
        });

    }
}


