"use strict";
// =============== PHASER CREATE GAME ENVIRONMENT ==============================

function core_create() {


    // start physics and add basic sprites
    let grass_sprite = game.add.sprite(0, 0, level_backgrounds[level_names[current_level%number_of_levels]].green);
    let dirt_sprite = game.add.sprite(0, 0, level_backgrounds[level_names[current_level%number_of_levels]].dirt);
    let sky_sprite = game.add.sprite(0, 0, level_backgrounds[level_names[current_level%number_of_levels]].sky);

    if(is_retina()){
        grass_sprite.scale.setTo(0.5,0.5);
        dirt_sprite.scale.setTo(0.5,0.5);
        sky_sprite.scale.setTo(0.5,0.5);
    }

    // sprite group for clouds
    cloud_object_group = game.add.group();

    //enable swipe and set time delta between swipe events
    swipe_gesture_recognizer = new Swipe(game);
    swipe_gesture_recognizer.next_event_rate = key_change_time_block;
    swipe_direction = 0;

    // set some time variables so thehy are not undefined
    rail_object_time = game.time.now;
    dam_object_time = game.time.now;
    key_change_time = game.time.now;
    last_velocity_scale_time = game.time.now;
    time_now = game.time.now;
    time_last = time_now - 1;
    last_bad_wall_collision_time = 0;
    last_eu_star_collision_time = 0;
    last_esc_use_time = 0;
    firebase_submission_time = time_now + firebase_submission_delay;

    // add the animated rails
    let rails = game.add.sprite(0, 208, 'rails');

    if(is_retina()) {
        rails.scale.setTo(0.5, 0.5);
    }

    rails.animations.add('move', [0, 1, 2], 8, true);
    rails.animations.play('move');

    // sprite group fot rail objects
    rail_object_group = game.add.group();

    // statistics display
    let style = "align:center;font-family:'SilkScreen',monospace";
    panel = game.add.sprite(0, canvas_height - 72, 'panel');
    if(is_retina())
        panel.scale.setTo(0.5,0.5);
    text_score = game.add.text(0, canvas_height - 72, "0", style);
    text_score.anchor.set(0.5);
    text_distance = game.add.text(0, canvas_height - 72, "0m", style);
    text_distance.anchor.set(0.5);

    flying_coin_group = game.add.group();

    // add player (train)
    train = game.add.sprite(train_position[1], train_spacing_y, 'train');
    game.physics.arcade.enable(train);

    //sprite name, array of positions within sprite, fps, should loop
    train.animations.add('train_left', [0, 1], 7, true);
    train.animations.add('train_center', [2, 3], 7, true);
    train.animations.add('train_right', [4, 5], 7, true);
    train.animations.add('jump_left',[6],10,true);
    train.animations.add('jump_right',[7],10,true);

    train.animations.add('collision_left',[8,9,20],10,true);
    train.animations.add('collision_center',[10,11,20],10,true);
    train.animations.add('collision_right',[12,13,20],10,true);

    train.animations.add('star_left', [14,15], 10, true);
    train.animations.add('star_center', [16,17], 10, true);
    train.animations.add('star_right', [18,19], 10, true);

    if(is_retina()) {
        //train.scale.setTo(0.5, 0.5);
    }

    // train is at center rail
    train.animations.play('train_center');
    train.rail = 1;
    train.indefeatable = false;
    train.star_phase = false;

    // fade in rectangle
    let rect = game.add.sprite(0,0,"black");
    rect.width = canvas_width;
    rect.height = canvas_height;
    rect.alpha = 1;

    let fade_out = game.add.tween(rect).to(
                                            {
                                                alpha: 0
                                            },
                                            2*state_transition_duration,
                                            Phaser.Easing.Linear.None
                                          );
    is_fading_to_next_level = false;

    let level_style = { align:"center",
                       fill:'red',
                       font:"50px 'SilkScreen' monospace"
                      }

    let text_level = game.add.text(canvas_width/2,
                               canvas_height/6,
                               "LEVEL " + (current_level+1),
                               level_style);
    text_level.anchor.set(0.5);
    text_level.font = 'SilkScreen';
    let text_level_fade_out = game.add.tween(text_level).to(

                                                      {
                                                          alpha: 0
                                                      },
                                            5000,
                                            Phaser.Easing.Linear.None
                                            );

    fade_out.onComplete.add( function (){
        text_level_fade_out.start();
        activate_pause_button();
    });

    fade_out.start();

    updateStatistics();

    create_pause_menu();

    //open coin menu when clicking on coin label
    if (!is_mobile()) {
        game.input.onDown.add(function(event) {
            if(event.x >= 0 && event.x <= canvas_width/2 && event.y > canvas_height-panel.height && event.y <= canvas_height ){
                if (pause_menu.is_active && pause_menu.is_coin_menu) {
                    hide_pause_menu();
                } else {
                    show_coin_menu();
                }
            }
        },this);
    }


    /*
    coin_notifier = game.add.sprite(0,canvas_height-100,"coin_notifier");
    coin_notifier.width = 180;
    coin_notifier.height = 100;
    coin_notifier.animations.add("disappear",[1],1,false);
    coin_notifier.animations.add("blink",[0,1],8,true);
    coin_notifier.animations.play("disappear");
    */
}

// =============== PHASER UPDATE GAME ENVIRONMENT ==============================

function core_update() {

    //time handling
    time_last = time_now;
    time_now = game.time.now;

    let time_delta = time_now - time_last;

    // pause the game (so far, go to end state)
    if (key_esc.isDown &&
        time_now - last_esc_use_time > key_change_time_block) {
        last_esc_use_time = time_now;
        //key_change_time = time_now;
        //next_level("end");
        //game.paused = true;
        if (!pause_menu.is_active)
            show_pause_menu();
        else
            hide_pause_menu();
    }

    let direction = null;
    // don't update large time deltas (e.g. when paused)
    if (time_delta > 500 || pause_menu.is_active)
    {
        last_bad_wall_collision_time += time_delta;
        last_eu_star_collision_time += time_delta;
        last_velocity_scale_time += time_delta;
        key_change_time += time_delta;
        train_up_jump_start += time_delta;
        rail_jump_start += time_delta;
        rail_object_time += time_delta;
        dam_object_time += time_delta;

        return;
    }

    // mute and unmute sound
    if (key_mute.isDown && key_mute_block == key_change_time_block) {
        game.sound.mute = !game.sound.mute;
        if (is_mobile()) {
            localStorage.setItem('mute',game.sound.mute);
        }
        key_mute_block -= 10;
    } else if (key_mute_block < key_change_time_block &&
               key_mute_block > 0) {
        key_mute_block -= 10;
    } else {
        key_mute_block = key_change_time_block;
    }


    // ========================= PLAYER CONTROL ===========================
    if(IOS_MODE) {
        if(swipe_direction == 1) {
            direction = swipe_gesture_recognizer.DIRECTION_LEFT;
        } else if(swipe_direction == 2) {
            direction = swipe_gesture_recognizer.DIRECTION_RIGHT;
        } else if(swipe_direction == 3) {
            direction = swipe_gesture_recognizer.DIRECTION_UP;
        }

        // reset swipe
        swipe_direction = 0;
    } else {
        let swipe = swipe_gesture_recognizer.check();
        if(swipe != null) {
            direction = swipe.direction;
        }
    }

    if (key_space.isDown) {
        sound_whistle.play();
    }

    // check if player can change rail
    if (
        train.rail !== -1 &&
        time_now - key_change_time > key_change_time_block
        ) {
        let jump_direction = null;
        if (((             // go left
              direction !== null
              && direction == swipe_gesture_recognizer.DIRECTION_LEFT
              ) ||
             key_left.isDown
             ) &&
            train.rail > 0
            ) {
            rail_is_changing = true;
            if ( (!train.star_phase) && (!train.indefeatable) ){
                train.animations.play("jump_left");
            }
            jump_direction = -1;
        } else if (((      // go right
                     direction !== null
                     &&  direction == swipe_gesture_recognizer.DIRECTION_RIGHT
                     ) ||
                    key_right.isDown
                    ) &&
                   train.rail < 2
                   ) {
            rail_is_changing = true;
            if ( (!train.star_phase) && (!train.indefeatable) ){
                train.animations.play("jump_right");
            }
            jump_direction = +1;
        }

        if (rail_is_changing) {
            train.v_x = jump_direction / rail_jump_duration;
            train_rail_next = train.rail + jump_direction;
            rail_jump_start = time_now;
            key_change_time = time_now;
            rail_can_change = false;
            train_can_jump_up = false;
            train.rail = -1;
            train.x_previous = train.x;
            train.y_previous = train.y;
            sound_jump.play();
        }
    }

    // check if train should jump up
    if (train.rail !== -1 && time_now - key_change_time > key_change_time_block ) {
        if ((direction !== null &&
             direction == swipe_gesture_recognizer.DIRECTION_UP) ||
            key_up.isDown
            ) {
            train_is_jumping_up = true;
            train_rail_next = train.rail;
            train_up_jump_start = time_now;
            train.rail = -1;
            train_can_jump_up = false;
            sound_jump.play();
        }
    }

    if (train_is_jumping_up) {
        let time_delta = (time_now - train_up_jump_start);
        if (time_delta < train_up_jump_duration) {
            let a = 1 / 300.0;
            train.y = train_spacing_y - time_delta
            * train_up_jump_duration * a
            + Math.pow(time_delta, 2) * a;
        } else {
            train.y = train_spacing_y;
            train.rail = train_rail_next;
            rail_can_change = true;
            train_can_jump_up = true;
            train_is_jumping_up = false;
            if (train.star_phase) {
                train.animations.play(train_star_animations[train.rail]);
            } else if (train.indefeatable) {
                train.animations.play(train_collision_animations[train.rail]);
            } else {
                train.animations.play(train_animations[train.rail]);
            }
        }
    } else if (rail_is_changing) {
        // rail change animation
        let time_delta = (time_now - rail_jump_start);
        if (time_delta < rail_jump_duration) {
            train.x = train.x_previous + train_position_distance
            * train.v_x * time_delta;
            let a = 0.002;
            train.y = train_spacing_y - time_delta
            * rail_jump_duration * a
            + Math.pow(time_delta, 2) * a;
        } else {
            train.x = train_position[train_rail_next];
            train.y = train_spacing_y;
            train.rail = train_rail_next;
            rail_can_change = true;
            train_can_jump_up = true;
            rail_is_changing = false;
            if (train.star_phase) {
                train.animations.play(train_star_animations[train.rail]);
            } else if (train.indefeatable) {
                train.animations.play(train_collision_animations[train.rail]);
            } else {
                train.animations.play(train_animations[train.rail]);
            }
        }
    } else if (train.star_phase) {
        if (time_now - last_eu_star_collision_time > eu_star_phase_duration) {
            train.star_phase = false;
            train.animations.play(train_animations[train.rail]);
        } else {
            train.star_phase = true;
            train.animations.play(train_star_animations[train.rail]);
        }
    } else if (train.indefeatable) {
        if (time_now - last_bad_wall_collision_time > wall_animation_length) {
            train.indefeatable = false;
            train.animations.play(train_animations[train.rail]);
        } else if (time_now - wall_animation_length > 0) {
            train.indefeatable = true;
            train.animations.play(train_collision_animations[train.rail]);
        }
    }

    // ====================== UPDATING RAIL AND DAM OBJECTS ====================

    // for saving the indices of objects being out of scope

    let rail_indices_to_remove = Array();
    let dam_indices_to_remove = Array();

    // loop trough all rail objects
    for (let i = 0; i < rail_objects.length; i++) {
        // update according to new time
        // pass the train object to see if there's a collision
        update_rail_object(rail_objects[i],train,time_delta);

        // remove if the object is now out of scope
        if (!rail_objects[i].active) {
            rail_indices_to_remove.push(i);
            if (rail_objects[i].kind == "eurostar") {
                eu_star_can_spawn = true;
            }
        }

        // if there's a collision with the train
        if (rail_objects[i].collision) {

            // set a new starting point for this object
            // both in time and space
            rail_objects[i].time_start = time_now;
            rail_objects[i].point_start_x = rail_objects[i].sprite.x;
            rail_objects[i].point_start_y = rail_objects[i].sprite.y;

            // save direction of the object in case
            // it's a wall and has to fly somewhere
            let left_right;
            if(rail_objects[i].rail == 0) {
                left_right = 1;
            } else if(rail_objects[i].rail == 1) {
                left_right = 1 - 2 * Math.floor(Math.random() * 2);
            } else if(rail_objects[i].rail == 2) {
                left_right = -1;
            }

            rail_objects[i].direction = left_right;

            // give this object to the collision updates
            collision_objects.push(rail_objects[i]);
        }
    }
    delete_indices_from_array(rail_indices_to_remove, rail_objects);

    // update all dam objects in a similar manner
    for (let i = 0; i < dam_objects.length; i++) {
        update_rail_object(dam_objects[i],train,time_delta);
        if (!dam_objects[i].active) {
            dam_indices_to_remove.push(i);
        }
    }
    delete_indices_from_array(dam_indices_to_remove, dam_objects);

    // loop through collision objects

    let collision_indices = Array();

    for (let i=0; i < collision_objects.length; i++) {

        // update according to their logic
        collision_update(collision_objects[i],train);

        // remove if collision animation is over (set in collision_update())
        if (!collision_objects[i].collision) {
            collision_indices.push(i);
        }
    }
    delete_indices_from_array(collision_indices, collision_objects);

    // ========================= SPAWNING NEW OBJECTS ============================
    //
    if (time_now - rail_object_time > rail_object_rate) {

        let kind = 'coin';
        let random_float = Math.random();
        let spawn_at_rail = null;

        // there's different objects if the train is in star_phase
        if (!train.star_phase){
            if (eu_star_can_spawn &&
                rail_objects.length > 0 &&
                rail_objects[rail_objects.length-1].kind == 'wall' &&
                random_float < eu_star_appearance_probability()) {
                kind = 'eurostar';
                eu_star_can_spawn = false;
                spawn_at_rail = rail_objects[rail_objects.length-1].rail;
            }
            else if (random_float < eu_star_appearance_probability() + 0.2) {
                kind = 'wall';
            } else if (random_float < eu_star_appearance_probability() + 0.24) {
                kind = 'gate';
            } else {
                kind = 'coin';
            }
        } else {
            let total_populist_probability = 0;
            for (let populist in populist_probabilities) {
                // skip loop if the property is from prototype
                if (!populist_probabilities.hasOwnProperty(populist)) continue;

                total_populist_probability += populist_probabilities[populist];

                if (random_float < total_populist_probability) {
                    kind = populist;

                    // get out of for loop
                    break;
                }
            }

        }

        rail_objects.push(get_rail_object(kind,spawn_at_rail));

        // bring the older objects to the top again
        for (let i = rail_objects.length; i--; ) {
            rail_objects[i].sprite.bringToTop();
        }

        rail_object_time = time_now;
    }

    // spawn new dam objects
    if (time_now - dam_object_time > dam_object_rate) {

        let total_dam_probability = 0;
        let random_number = Math.random();

        for (let kind in dam_probabilities) {

            // skip loop if the property is from prototype
            if (!dam_probabilities.hasOwnProperty(kind)) continue;

            total_dam_probability += dam_probabilities[kind];

            if (random_number < total_dam_probability) {
                dam_objects.push(get_dam_object(kind));

                for (let i = dam_objects.length; i--; ) {
                    dam_objects[i].sprite.bringToTop();
                }

                // get out of for loop
                break;
            }
        }
        dam_object_time = time_now;
    }

    for (let i = 0; i < eu_star_objects.length; i++) {
        eu_star_objects[i].sprite.bringToTop();
    }

    // =========== update velocity after collision ============
    update_velocity();

    // spawn new clouds
    if (Math.random() < 0.01) {
        generate_cloud();
    }

    // update statistics
    meter_counter += time_delta * v / 1000.0;

    // Firebase: Save game result every 15 seconds.
    var firebase_time_now = game.time.now;
    if (firebase_submission_time + firebase_submission_delay < firebase_time_now) {
        updateGameResult(coin_counter, meter_counter);
        firebase_submission_time = firebase_time_now;
        updateStatistics();
    }

    text_score.x = Math.floor(panel.x + panel.width / 4 + 16);
    text_score.y = Math.floor(panel.y + panel.height / 2 + 4);
    text_score.setText(get_metric_prefix(Math.floor(coin_counter), 2));
    text_score.font = 'SilkScreen';

    text_distance.x = Math.floor(panel.x + panel.width / 4 * 3 + 1);
    text_distance.y = Math.floor(panel.y + panel.height / 2 + 4);
    text_distance.setText(
                          get_metric_prefix(Math.floor(meter_counter), 2) + "m"
                          );
    text_distance.font = 'SilkScreen';
}

function update_velocity(scale_event,scale) {

    function scale_velocity(new_scale) {
        v = new_scale * v_default;
        rail_object_rate = rail_object_rate_default / new_scale;
        dam_object_rate = dam_object_rate_default / new_scale;
    }

    if (scale_event == null) {
        //do a simple update according to the acceleration rules
        //
        if (last_scale_event == "collision")
        {
            let time_delta = time_now - time_last;

            if ( time_now - last_velocity_scale_time < time_until_full_velocity) {
                let v_drop = v_default * last_velocity_scale;
                v += time_delta * (v_default - v_drop) / time_until_full_velocity;
                let rail_object_rate_drop = rail_object_rate_default / last_velocity_scale;
                let dam_object_rate_drop = dam_object_rate_default / last_velocity_scale;
                rail_object_rate += time_delta / time_until_full_velocity * (rail_object_rate_default - rail_object_rate_drop);
                dam_object_rate += time_delta / time_until_full_velocity * (dam_object_rate_default - dam_object_rate_drop);
            }
            else {
                last_scale_event = "default";
                scale_velocity(1.0);
            }
        }
        else if (last_scale_event == "star")
        {
            if (time_now - last_velocity_scale_time > eu_star_phase_duration) {
                last_scale_event = "default";
                scale_velocity(1.0);
            }
        }

    }
    else if (scale_event == "default") {
        // scale back to standard values
        last_scale_event = "default";
        scale_velocity(1.0);
    }
    else if (scale_event == "collision") {
        // scale to wanted scale
        last_scale_event = "collision";
        last_velocity_scale = collision_velocity_drop_ratio;
        last_velocity_scale_time = time_now;
        scale_velocity(last_velocity_scale);
    }
    else if (scale_event == "star") {
        last_scale_event = "star";
        last_velocity_scale = eu_star_phase_factor();
        last_velocity_scale_time = time_now;
        scale_velocity(last_velocity_scale);
    }
    else if (scale_event == "increase_default_velocity"){
        let v_scale = v_default / (v_default + eu_event_delta_v);
        v_default += eu_event_delta_v;
        v = v_default;
        rail_object_rate_default *= v_scale;
        dam_object_rate_default *= v_scale;
        rail_object_rate = rail_object_rate_default;
        dam_object_rate = dam_object_rate_default;
        last_scale_event = "default";
    }
    else if (scale_event == "level_change"){
        let v_scale = v_default / (v_initial + eu_event_delta_v * current_level);
        v_default /= v_scale;
        v = v_default;
        rail_object_rate_default *= v_scale;
        dam_object_rate_default *= v_scale;
        rail_object_rate = rail_object_rate_default;
        dam_object_rate = dam_object_rate_default;
        last_scale_event = "default";
    }

}

function get_metric_prefix(decimal, number_digits) {
    let prefix = [
                  { value: 1E18, symbol: "E" },
                  { value: 1E15, symbol: "P" },
                  { value: 1E12, symbol: "T" },
                  { value: 1E09, symbol: "G" },
                  { value: 1E06, symbol: "M" },
                  { value: 1E03, symbol: "k" }
                  ];
    let expression = /\.0+$|(\.[0-9]*[1-9])0+$/;
    for (let i = 0; i < prefix.length; i++) {
        if (decimal >= prefix[i].value) {
            return (decimal / prefix[i].value)
            .toFixed(number_digits)
            .replace(expression, "$1")
            + prefix[i].symbol;
        }
    }
    return decimal.toFixed(number_digits).replace(expression, "$1");
}

function generate_cloud() {
    let seed = Math.random();
    let cloud_height = Math.random() * 176;
    let cloud_type = 'cloud0';
    if (seed < 0.333) {
        cloud_type = 'cloud1';
    } else if (seed < 0.667) {
        cloud_type = 'cloud2';
    } else {
        cloud_type = 'cloud0';
    }
    let cloud = cloud_object_group.create(-60, cloud_height, cloud_type);
    if(is_retina()) {
        cloud.scale.setTo(0.5,0.5);
    }
    cloud.checkWorldBounds = true;
    cloud.events.onOutOfBounds.add( function () {
                                   if (cloud.x > canvas_width)
                                   cloud.destroy();
                                   });
    game.physics.arcade.enable(cloud);
    cloud.body.gravity.x = 2 + Math.random() * 4;
}

function delete_indices_from_array(indices, array) {

    // delete object from rail_objects updated
    for (let i = indices.length - 1; i >= 0; i--) {
        array.splice(indices[i], 1);
    }
}

function collision_update(object, train) {

    //====================== COIN COLLISION ============================
    //
    if (object.kind == "coin") {
        sound_bling.play();
        object.collision = false;
        // delete old coin from rail
        object.sprite.destroy();

        if (!is_fading_to_next_level) {
            let sprite = flying_coin_group.create(
                                                  object.sprite.x-object.sprite.width/2,
                                                  object.sprite.y-object.sprite.height/2,
                                                  "coin"
                                                  );
            sprite.width = object.sprite.width;
            sprite.height = object.sprite.height;
            set_coin_sprite(sprite);
            sprite.anchor.setTo(0.5,0.5);

            const coin_duration = 800;
            let coin_collect = game.add.tween(sprite).to(
                                                         {
                                                         x: text_score.x,
                                                         y: text_score.y,
                                                         width: sprite.width/2,
                                                         height: sprite.height/2,
                                                         alpha: .6
                                                         },
                                                         coin_duration,
                                                         Phaser.Easing.Cubic.Out
                                                         );
            coin_collect.onComplete.add(function () {
                                        update_coin_counter(1,train);
                                        sprite.destroy();
                                        });

            // start transition to coin label
            coin_collect.start();
        }
    }

    // ============================== STAR COLLISION =================================
    //
    if (object.kind == "eurostar") {
        let time_delta = time_now - object.time_start;
        if (time_delta > eu_star_phase_duration) {
            object.collision = false;
        } else if (time_delta === 0.0){


            //gameplay actions
            sound_eu_star.play();
            update_coin_counter(25,train);
            object.sprite.animations.play("static");

            //set new object properties
            let position_next = get_next_eu_star_position();
            object.sprite.anchor.setTo(0.5, 0.5);
            object.angle_index = position_next.angle_index;
            let scale_next = rail_distance_inner * 1.5
            / object.object_height_original;
            eu_star_objects.push(object);

            let auto_start = false;
            let delay = 0;

            let sky_travel = game.add.tween(object.sprite).to(
                                                              {
                                                              x: position_next.x,
                                                              y: position_next.y
                                                              },
                                                              eu_star_travel_time,
                                                              Phaser.Easing.Cubic.Out,
                                                              auto_start,
                                                              delay
                                                              );
            let sky_scale = game.add.tween(object.sprite.scale).to(
                                                                   {
                                                                   x: scale_next,
                                                                   y: scale_next
                                                                   },
                                                                   eu_star_travel_time,
                                                                   Phaser.Easing.Cubic.Out,
                                                                   auto_start,
                                                                   delay
                                                                   );

            if (position_next.star_is_last) {
                eu_star_can_spawn = false;
                sky_travel.onComplete.add(eu_flag_complete_event);
            } else {
                eu_star_can_spawn = true;
            }


            sky_travel.start();
            sky_scale.start();

            // set train properties
            train.star_phase = true;
            last_eu_star_collision_time = time_now;


            // velocities
            update_velocity("star");
        }
    }

    // ========================= WALL / POPULIST COLLISION ====================
    //
    if (train.star_phase) {
        if (object.kind == "wall" ||
            object.kind == "wall_franke" ||
            object.kind == "rezzep" ||
            object.kind == "wall_rezzep" ||
            object.kind == "gate" ||
            object.kind == "wall_gerd" ||
            object.kind == "gerd" ||
            object.kind == "mirovich" ||
            object.kind == "wall_dagbert") {
            let time_delta = time_now - object.time_start;
            if (time_delta > wall_animation_length) {
                object.sprite.destroy();
                object.collision = false;
            } else if (time_delta === 0.0) {
                sound_smash.play();
                notify_objective_c("smashed-wall");
                if (!is_fading_to_next_level)
                    update_coin_counter(eu_wall_collision_reward,train);
            } else{
                object.sprite.x = object.point_start_x
                + object.direction
                * time_delta;
                object.sprite.y = object.point_start_y
                - time_delta / 100.0
                + Math.pow(time_delta, 2) / 1000.0;
                object.sprite.angle = object.direction * time_delta / 5;
            }
        }
    }  else {
        if (object.kind == "wall" ||
            object.kind == "wall_franke" ||
            object.kind == "rezzep" ||
            object.kind == "wall_rezzep" ||
            object.kind == "gate" ||
            object.kind == "wall_gerd" ||
            object.kind == "gerd" ||
            object.kind == "mirovich" ||
            object.kind == "wall_dagbert") {
            let time_delta = time_now - object.time_start;
            if (time_delta > wall_animation_length) {
                object.sprite.destroy();
                object.collision = false;
            } else if (time_delta === 0.0){
                sound_smash.play();
                notify_objective_c("smashed-wall");
                if (!is_fading_to_next_level)
                    update_coin_counter(wall_coin_penalty,train);
                update_velocity("collision");

                //for handling of train animations
                train.indefeatable = true;
                last_bad_wall_collision_time = time_now;
            } else {
                object.sprite.x = object.point_start_x
                + object.direction * time_delta;
                object.sprite.y = object.point_start_y
                - time_delta / 100.0
                + Math.pow(time_delta, 2) / 1000.0;
                object.sprite.angle = object.direction * time_delta / 5;
            }
        }
    }
}

function flip_z(z) {
    return canvas_height - z;
}

function flip_x(x) {
    return canvas_width - x;
}

function get_dam_object(kind) {

    // get spawn rail

    let random_rail = Math.floor(Math.random() * 2);
    let min_distance_to_rail = 15; // if this is smaller than 35,

    // get corresponding starting position
    let dam_width = canvas_width / 2
    - 1.5 * rail_distance_outer
    - rail_distance_inner - min_distance_to_rail;
    let exp_random = - Math.log(1-Math.random()) * (dam_width) / 3.;
    if (exp_random>dam_width) {
        exp_random = dam_width * Math.random();
    }

    if (random_rail == 0){
        exp_random = dam_width - exp_random;
    }

    let dam_offset = random_rail * (canvas_width / 2
                                    + 1.5 * rail_distance_outer
                                    + rail_distance_inner + min_distance_to_rail);

    let point_start_x = exp_random + dam_offset;
    let object_height;
    let object_width;
    let object_height_original;
    let object_width_original;

    let sprite = rail_object_group.create(0, 0, kind);

    sprite.anchor.setTo(0.5,0);

    if (kind == "tree0") {
        object_height = 40;
    } else if (kind == "tree1") {
        object_height = 35;
    } else if (kind == "olivetree") {
        object_height = 35;
    } else if (kind == "tree2") {
        object_height = 35;
    } else if (kind == "tree3") {
        object_height = 55;
    } else if (kind == "bush") {
        object_height = 10;
    } else if (kind == "sign") {
        object_height = 20;
    } else if (kind == "franke") {
        object_height = 25;
    } else if (kind == "dagbert") {
        object_height = 25;
    } else if (kind == "rezzep") {
        object_height = 25;
    } else if (kind == "mirovich") {
        object_height = 25;
    } else if (kind == "gerd") {
        object_height = 25;
    } else if (kind == "cactus0") {
        object_height = 35;
    } else if (kind == "cactus1") {
        object_height = 15;
    } else if (kind == "tumbleweed") {
        object_height = 10;
    } else if (kind == "goat") {
        object_height = 15;
    } else if (kind == "tulips") {
        object_height = 15;
    }

    sprite.anchor.setTo(0.5, 0.5);

    // set start x-value
    sprite.x = point_start_x;
    // flip_z is necessary due to different orientation of screen coordinates
    sprite.y = flip_z(horizon + object_height / 2);

    // get the original height of the object to scale it to the wanted heifht
    object_height_original = sprite.height;
    object_width_original = sprite.width;

    //get and set new scale
    let scale_next = object_height / object_height_original;
    sprite.scale.setTo(scale_next, scale_next);
    object_width = sprite.width;

    let rail_object = {

        "kind": kind,
        "rail": -1,
        "sprite": sprite,
        "object_height_original": object_height_original,
        "object_width_original": object_width_original,
        "time_start": time_now,
        "active": true,
        "object_width": object_width,
        "object_height": object_height,
        "point_start_x": point_start_x,
        "y": 0,
        "collision": false
    };

    return rail_object;
}

function get_rail_object(kind,spawn_at_rail)
{
    // get spawn rail
    let random_rail;
    if (spawn_at_rail == null)
        random_rail = Math.floor(Math.random() * 3);
    else
        random_rail = spawn_at_rail;

    if (kind == 'gate')
        random_rail = 1;

    //get corresponding starting position
    let point_start_x = canvas_width / 2
    - rail_distance_outer - rail_distance_inner
    + random_rail * (rail_distance_outer
                     + rail_distance_inner);

    let object_height = null;
    let object_width = null;
    let object_height_original;
    let object_width_original;

    let sprite = rail_object_group.create(0, 0, kind);

    if (kind == 'wall') {
        object_height = rail_distance_inner * 0.80;
    } else if (kind == 'wall_franke') {
        object_height = rail_distance_inner * 1.55;
    } else if (kind == 'wall_dagbert') {
        object_height = rail_distance_inner * 1.55;
    } else if (kind == 'wall_rezzep') {
        object_height = rail_distance_inner * 1.6;
    } else if (kind == 'wall_gerd') {
        object_height = rail_distance_inner * 1.6;
    } else if (kind == 'gate') {
        object_width = rail_distance_inner * 3 + rail_distance_outer*4;
    } else if (kind == "rezzep") {
        object_height = 25;
    } else if (kind == "mirovich") {
        object_height = 25;
    } else if (kind == "gerd") {
        object_height = 25;
    } else if (kind == 'eurostar') {
        object_height = rail_distance_inner;
        sprite.animations.add("blink",[0,1,2],8,true);
        sprite.animations.add("static",[0],8,true);
        sprite.animations.play("blink");
    } else if (kind == 'coin') {
        object_height = rail_distance_outer;
        set_coin_sprite(sprite);
    }

    sprite.anchor.setTo(0.5, 0.5);

    // set start x-value
    sprite.x = point_start_x;

    // flip_z is necessary due to different orientation of screen coordinates
    sprite.y = flip_z(horizon + object_height / 2);

    // get the original height of the object to scale it to the wanted heifht
    object_height_original = sprite.height;
    object_width_original = sprite.width;

    // get and set new scale
    if (object_width == null) {
        let scale_next = object_height / object_height_original;
        sprite.scale.setTo(scale_next, scale_next);
        object_width = sprite.width;
    } else if (object_height == null) {
        let scale_next = object_width / object_width_original;
        sprite.scale.setTo(scale_next, scale_next);
        object_height = sprite.height;
    }

    let rail_object = {

        "kind": kind,
        "rail": random_rail,
        "sprite": sprite,
        "object_height_original": object_height_original,
        "object_width_original": object_width_original,
        "time_start": game.time.now,
        "y": 0,
        "active": true,
        "object_width": object_width,
        "object_height": object_height,
        "point_start_x": point_start_x,
        "collision": false
    };

    return rail_object;
}

function set_coin_sprite(sprite){
    sprite.animations.add('rotate0', [0, 1, 2], 8, true);
    sprite.animations.add('rotate1', [1, 2, 0], 8, true);
    sprite.animations.add('rotate2', [2, 0, 1], 8, true);
    let flip = Math.random();
    if (flip < 0.333) {
        sprite.animations.play('rotate0');
    } else if (flip < 0.667) {
        sprite.animations.play('rotate1');
    } else {
        sprite.animations.play('rotate2');
    }
}

function update_rail_object(object, schulzzug, time_delta) {

    // get position between horizon and camera
    let y = object.y + v * time_delta;
    object.y = y;

    // get center position of test object
    let sprite_center_x = camera_x
    - horizon_distance / (horizon_distance - y)
    * (camera_x - object.point_start_x);

    // set center position of object
    object.sprite.x = sprite_center_x;

    // get new width
    let width = -horizon_distance * ((camera_x
                                      - (object.point_start_x + object.object_width / 2))
                                     / (horizon_distance - y) - (camera_x
                                                                 - (object.point_start_x - object.object_width / 2))
                                     / (horizon_distance - y));

    // get and set new scale of object
    let wScale = width / object.object_width_original;
    object.sprite.scale.setTo(wScale);

    // get vertical coordinate
    let height = camera_height - horizon_distance
    / (horizon_distance - y) * (camera_height
                                - object.object_height / 2) + horizon;
    object.sprite.y = flip_z(height);

    // get collision range, destroy if out of scope
    if (y > horizon_distance)
    {
        object.sprite.alpha = 0;
        object.sprite.destroy();
        object.active = false;
    }



    if (object.rail >= 0 &&
        object.rail <= 2 &&
        y > y_collision_range_start &&
        y < y_collision_range_end &&
        !schulzzug.indefeatable &&
         ( object.rail == schulzzug.rail ||
          ( object.kind == 'gate' && schulzzug.rail != -1 )
         )
       ){
            if (object.kind == 'gate')
                object.rail = schulzzug.rail;

            object.collision = true;
            object.active = false;
    }
}

function notify_objective_c(notifciation) {
    if(IOS_MODE) {
        let iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", "ios-js://"+notifciation);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    }
}

function activateIosMode() {
    IOS_MODE = true;
}

function update_coin_counter(coins,from_object) {

    let is_from_spending = false;
    if (from_object == null){
        from_object = text_score;
        is_from_spending = true;
    }

    // only update if not a single coin
    if ((Math.abs(coins) > 1 && !is_from_spending) || ((Math.abs(coins)>0) && is_from_spending) ){
        let style = {align:"center",
            font:'30px SilkScreen monospace'}
        let base_text = "";
        if (coins>0) {
            base_text = "+";
            style.fill = "green";
        } else if (coins<0) {
            base_text = "";
            style.fill = "red";
        }

        let text_coin;

        text_coin = game.add.text(from_object.x+from_object.width/2, from_object.y, "0", style);
        text_coin.anchor.set(0.5);
        text_coin.setText(base_text+Math.round(coins));
        text_coin.font = 'SilkScreen';

        let up_duration = 1500;
        let coin_up = game.add.tween(text_coin).to(
                                                   {
                                                   y: 0,
                                                   alpha: 0
                                                   },
                                                   up_duration,
                                                   Phaser.Easing.Linear.None
                                                   );

        coin_up.onComplete.add( function () {
                               text_coin.destroy()
                               });
        coin_up.start();
    }

    // if the player loses too much coins and doesn't know
    if (!used_coin_menu_already &&
        coins < 0 ) {
        total_lost_coins += Math.abs(coins);
        if (total_lost_coins >= lost_coins_at_which_to_start_notifying &&
            coin_counter >= min_coins_at_which_to_start_notifying) {
            //coin_notifier.animations.play("blink");
            show_coin_notifier();
        }
    }

    //check if too negative
    if (coin_counter + coins < 0) {
        coin_counter = 0;
    } else {
        coin_counter += coins;
    }

    text_score.setText(get_metric_prefix(Math.floor(coin_counter), 2));
}

function eu_flag_complete_event() {
    let eu_flag_radius = canvas_width / 1.5;
    let eu_flag_height = canvas_width / 3.0;
    let eu_flag_position = {
    x: canvas_width / 2.0,
    y: canvas_height + eu_flag_radius + eu_flag_height / 2.0
    };

    for(let i = eu_stars_count - 1; i >= 0; i--) {
        let star = eu_star_objects[i];
        let star_angle = get_angle_from_index(star.angle_index);
        let position_next = {
        x: eu_flag_position.x + eu_flag_radius * Math.cos(star_angle),
        y: eu_flag_position.y + eu_flag_radius * Math.sin(star_angle)
        };
        let scale_next = eu_flag_height / star.object_height_original;
        let star_alpha = 0;
        let auto_start = false;
        let delay = eu_star_phase_duration - eu_star_travel_time;

        let pulse_count = 12;
        let pulse_duration = delay / (2 * pulse_count);
        let pulse_scale = star.sprite.height
        / star.object_height_original * 1.3;
        let pulse_delay = 0;
        let pulse_yoyo = true;

        let star_pulse = game.add.tween(star.sprite.scale).to(
                                                              {
                                                              x: pulse_scale,
                                                              y: pulse_scale
                                                              },
                                                              pulse_duration,
                                                              Phaser.Easing.Bounce.InOut,
                                                              auto_start,
                                                              pulse_delay,
                                                              pulse_count,
                                                              pulse_yoyo
                                                              );

        let star_travel = game.add.tween(star.sprite).to(
                                                         {
                                                         alpha: star_alpha,
                                                         x: position_next.x,
                                                         y: position_next.y
                                                         },
                                                         eu_star_travel_time,
                                                         Phaser.Easing.Cubic.In,
                                                         auto_start
                                                         );
        let star_scale = game.add.tween(star.sprite.scale).to(
                                                              {
                                                              x: scale_next,
                                                              y: scale_next
                                                              },
                                                              eu_star_travel_time,
                                                              Phaser.Easing.Cubic.In,
                                                              auto_start
                                                              );
        if (i == 0) {
            star_travel.onComplete.add(function(target, tween) {
                                       target.destroy();
                                       //update_velocity("increase_default_velocity");
                                       eu_star_can_spawn = true;
                                       next_level();
                                       });
        } else {
            star_travel.onComplete.add(function(target, tween) {
                                       target.destroy();
                                       });
        }
        eu_star_objects.pop();

        star_pulse.onComplete.add(function(target, tween) {
                                  star_travel.start();
                                  star_scale.start();
                                  star.sprite.bringToTop();
                                  });

        star.sprite.animations.play("blink");
        star_pulse.start();
    }
}

function get_next_eu_star_position() {
    let index = Math.floor(Math.random() * eu_stars_indices.length);
    let index_phi = eu_stars_indices[index];
    eu_stars_indices.splice(index, 1);
    let angle = get_angle_from_index(index_phi);
    let position_next = {
    x: eu_position.x + eu_radius * Math.cos(angle),
    y: eu_position.y + eu_radius * Math.sin(angle),
    star_is_last: false,
    angle_index: index_phi
    };

    if (eu_stars_indices.length === 0) {
        position_next.star_is_last = true;
        for(let i=0; i<eu_stars_count; i++) {
            eu_stars_indices.push(i);
        }
    }

    return position_next;
}

function get_angle_from_index(index_phi) {
    let angle = (delta_phi * index_phi - 90) / 180 * Math.PI;
    return angle;
}

function switch_bg_music() {
    // in order to ensure that music resumes playing
    // in blocks of 4 bars
    if (sound_bg_music.isPlaying) {
        sound_bg_music.pause();
        let blocklength_of_4_bars_in_ms = 1 / (bg_music_bpm / 4 / 60) * 4 * 1000;
        let current_block = Math.floor(sound_bg_music.pausedPosition / blocklength_of_4_bars_in_ms);
        sound_bg_music.pausedPosition = current_block * blocklength_of_4_bars_in_ms;

    } else {
        sound_bg_music.resume();
    }
}

function next_level(next_level_key) {
    let rect = game.add.sprite(0,0,"black");
    rect.width = canvas_width;
    rect.height = canvas_height;
    rect.alpha = 0;

    //train.indefeatable = true;
    train.star_phase = true;
    is_fading_to_next_level = true;
    last_eu_star_collision_time = time_now;

    let fade_out = game.add.tween(rect).to(
                                            {
                                                alpha: 1
                                            },
                                            state_transition_duration,
                                            Phaser.Easing.Linear.None
                                          );
    fade_out.onComplete.add( function (){
        if (next_level_key == null) {
            current_level++;
            game.state.start(level_names[current_level % number_of_levels]);
            train.indefeatable = false;
            is_fading_to_next_level = false;
        } else {
            game.state.start(next_level_key);
        }
        //rect.destroy();
    });

    fade_out.start();
}

function eu_star_phase_factor() {
    // for the first level, the velocity up scale is
    // x 1+a
    // for the second, its
    // x 1+a^2
    // ...
    // for very large level numbers,
    // the velocity is not upscaled anymore
    return 1 + Math.pow(0.9, current_level);
}
