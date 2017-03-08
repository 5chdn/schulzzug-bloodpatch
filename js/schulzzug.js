/* global Phaser */


// ===================== DEFINE WORLD CONSTANTS ====================
// canvas size
const width = 375;
const height = 667;

// position of horizon on y-axis
const horizon_height = 208;
const horizon = height - horizon_height;

// distance to horizon
let L = 40000;

// height of camera
let h_camera = 50;

// x position of camera
let x_camera = width / 2;

// distances of rails at horizon
const raildistance_inner = 10;
const raildistance_outer = 6;

// Schulzzuggeschwindigkeit
let std_v = 10;  // standard velocity
let v = std_v;   // current velocity

//collision ranges
let y_collision_begin_range = height / 2 * L / (h_camera+height / 2);
let y_collision_end_range = y_collision_begin_range + 2000;

// ====================== EU STAR STUFF ===========================
let eu_radius = horizon_height / 4;
let eu_pos = {
    'x': width/2,
    'y': horizon_height/2
};
let N_eu_stars = 10;
let d_phi = 360 / N_eu_stars;
let eu_stars_indices = Array();
for(let i=0; i<N_eu_stars; i++)
    eu_stars_indices.push(i);
let star_objects = Array();
let eu_star_travel_time = 1000;
let can_spawn_new_star = true;
let delta_v_eu_event = 10;

// ===================== STERNPHASE DEFINTIIONS ==================
let sternphase_duration = 3000;
let sternphase_factor = 2;
let sternsound;

// ===================== DEFINE CONTROL VARIABLES ==================

// swipe handling
var IOS_MODE;
var swipeDirection;
let swipeGestureRecognizer;

// input keys
let key_left;
let key_right;
let key_up;
let key_space;

// key changing rate (ms)
let key_change_rate = 160; // time after which a new control command can be given
let last_key_change_time;  // last time a control command was given

// ====================== RAIL AND BAHNDAMM OBJECT PROPERTIES =========================

// rate of rail object appearance
let std_new_rail_object_rate = 500;
let new_rail_object_rate = std_new_rail_object_rate; // this is needed for changes in velocity
let last_rail_object_time; //time of last appearance

let std_new_bahndamm_object_rate = 200;
let new_bahndamm_object_rate = std_new_bahndamm_object_rate; // the current rate (changes when there's changes in velocity)
let bahndamm_probabilities = {
    "tree0": 0.02,
    "tree1": 0.02,
    "tree2": 0.0002,
    "bush": 0.02,
    "sign": 0.002,
    "trump": 0.002,
    "frauke": 0.002,
};

// object storing arrays and sprite groups
let railObjectGroup;       // for creating an object sprite in the right group
let railObjects = Array(); // storing the rail objects, s.t. they can be updated while approaching the train
let collisionObjects = Array(); // storing the collisionobjects s.t. they can be updated when a collision took place
let bahndammObjects = Array();  // same for bahndamm objects
let cloudObjectGroup;
let last_bahndamm_object_time; // time of last Bahndamm object appearance


// ====================== STATS COUNTERS ================================
let coin_counter = 0;
let meter_counter = 0;
let panel;          // sprite
let text_score;     // label
let text_distance;  // label


// ==================== SCHULZZUG DEFINITIONS ====================
let train;                                                       // sprite
let train_position = [ -10, (width - 120) / 2, width - 120+10 ]; // positions of sprite for the three rails
let distance_between_train_positions = 130;
let train_animations  = ["links","mitte","rechts"];              // names of the animation for each rail

let can_change_rail = true;          // this is false if the train jumps
let is_changing_rail = false;        // this is only true if the train is currently changing its rail
let rail_jump_duration = key_change_rate; // time the train needs to jump
let last_rail_jump_start;            // when the last jump started
let new_train_rail;                  // the next train rail after finishing the rail jump (0, 1 or 2)

let can_jump_up = true;
let is_jumping_up = false;
let up_jump_duration = 400;
let last_up_jump_start;

let train_std_y = 360;               // the usual distance to the top of the screen.

// ================= SOUNDS ========================
let bling;
let smash;
let jump;
let tada;
let whistle;
let ratter;


// duration of collision animation for crashes
let mauer_animation_length = 1000;



// ===================== SAVING CURRENT TIME FOR ANIMATIONS ====================
let current_time;


// ======================================= CREATE GAME ENGINE =============================================================
let game = new Phaser.Game(width, height, Phaser.AUTO, 'phaser-game', { preload: preload, create: create, update: update });

function preload() {
    game.load.image('landscape',  'assets/untergrund.50.png');
    game.load.image('grass',      'assets/green.50.png');
    game.load.image('dirt',       'assets/dirt.50.png');
    game.load.image('sky',        'assets/sky.50.png');
    
    game.load.image('dummy',      'assets/1pixel.png');
    game.load.image('tree0',      'assets/Tree01.50.png');
    game.load.image('tree1',      'assets/Tree02.50.png');
    game.load.image('tree2',      'assets/specialtree.50.png');
    game.load.image('cloud0',     'assets/cloud01.50.png');
    game.load.image('cloud1',     'assets/cloud02.50.png');
    game.load.image('cloud2',     'assets/cloud03.50.png');
    game.load.image('office',     'assets/Kanzleramt.50.png');
    game.load.image('bush',       'assets/Bush01.50.png');
    game.load.image('sign',       'assets/Sign01.50.png');
    
    game.load.image('panel',      'assets/Panel.50.png');
    game.load.image('fraukewall', 'assets/afd-wall.50.png');
    game.load.image('trumpwall',  'assets/Trump-Wall.50.png');
    game.load.image('frauke',     'assets/Petry.png');
    game.load.image('trump',      'assets/Trump.png');
    game.load.image('wall',       'assets/wall.png');
    game.load.image('stern',      'assets/star.png');
    
    game.load.spritesheet('coin', 'assets/Coin.50.png', 32, 32);
    game.load.spritesheet('rails','assets/rails_animation.50.png', 375, 460);
    game.load.spritesheet('train','assets/Trains_animation.50.png', 120, 232);
    
    game.load.audio('jump',    ['sounds/jump.mp3','sounds/jump.ogg','sounds/jump.wav']);
    game.load.audio('bling',   ['sounds/coin.mp3','sounds/coin.ogg','sounds/coin.wav']);
    game.load.audio('smash',   ['sounds/wall_smash.mp3','sounds/wall_smash.ogg','sounds/wall_smash.wav']);
    game.load.audio('stern',   ['sounds/bg_EU.mp3','sounds/bg_EU.ogg','sounds/bg_EU.wav']);
    game.load.audio('tada',    ['sounds/tada.mp3','sounds/tada.ogg','sounds/tada.wav']);
    game.load.audio('ratter',  ['sounds/ratter.mp3','sounds/ratter.ogg','sounds/ratter.wav']);
    game.load.audio('whistle', ['sounds/whistle.mp3','sounds/whistle.ogg','sounds/whistle.wav']);
    
}
function create() {
    
    //keys
    key_left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    key_right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    key_up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    key_space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    //start physics and add basic sprites
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.add.sprite(0, 0, 'landscape');
    game.add.sprite(0, 0, 'grass');
    game.add.sprite(0, 0, 'dirt');
    game.add.sprite(0, 0, 'sky');
    // sprite group for clouds
    cloudObjectGroup = game.add.group();
    
    
    //enable swipe and set time delta between swipe events
    swipeGestureRecognizer = new Swipe(game);
    swipeGestureRecognizer.next_event_rate = key_change_rate;
    swipeDirection = 0;
    
    // sounds
    bling = game.add.audio('bling');
    smash = game.add.audio('smash');
    jump = game.add.audio( 'jump');
    sternsound = game.add.audio( 'stern');
    tada = game.add.audio('tada');
    whistle = game.add.audio('whistle');
    ratter = game.add.audio( 'ratter');
    
    // start background train sound as loop
    ratter.loop = true;
    ratter.play();
    
    // set some time variables so thehy are not undefined
    last_rail_object_time = game.time.now;
    last_bahndamm_object_time = game.time.now;
    last_key_change_time = game.time.now;
    current_time = game.time.now;
    
    // add the animated rails
    let rails = game.add.sprite(0, 208, 'rails');
    rails.animations.add('move', [0, 1, 2], 8, true);
    rails.animations.play('move');
    
    // sprite group fot rail objects
    railObjectGroup = game.add.group();
    
    // add player (train)
    train = game.add.sprite(train_position[1], train_std_y, 'train');
    game.physics.arcade.enable(train);
    train.animations.add('links', [0, 1], 7, true);
    train.animations.add('mitte', [2, 3], 7, true);
    train.animations.add('rechts', [4, 5], 7, true);
    train.animations.add('jump_left',[6],10,true);
    train.animations.add('jump_right',[7],10,true);
    train.animations.add('collision',[8,9],10,true);
    train.animations.add('stern',[8],10,true);
    
    // train is in middle rail
    train.animations.play('mitte');
    train.rail = 1;
    train.indefeatable = false;
    train.sternphase = false;
    
    // statistics display
    let style = "align:center;font-family:'SilkScreen',monospace";
    panel = game.add.sprite(0, height - 72, 'panel');
    text_score = game.add.text(0, height - 72, "0", style);
    text_distance = game.add.text(0, height - 72, "0m", style);
    text_score.anchor.set(0.5);
    text_distance.anchor.set(0.5);
}

function update() {
    
    //time handling
    let last_time = current_time;
    current_time = game.time.now;
    let t = current_time;
    let dt = t - last_time;
    
    // ========================= PLAYER CONTROL ===========================
    var direction = null;
    if(IOS_MODE) {
        
        if(swipeDirection == 1) {
            direction = swipeGestureRecognizer.DIRECTION_LEFT;
        } else if(swipeDirection == 2) {
            direction = swipeGestureRecognizer.DIRECTION_RIGHT;
        } else if(swipeDirection == 3) {
            direction = swipeGestureRecognizer.DIRECTION_UP;
        }
        
        
        //reset swipe
        swipeDirection = 0;
    } else {
        
        var swipe = swipeGestureRecognizer.check();
        if(swipe != null) {
            direction = swipe.direction;
        }
        
    }
    
    if (key_space.isDown)
        whistle.play();
    
    // check if player can change rail
    if (
        train.rail !== -1 &&
        t-last_key_change_time>key_change_rate
        )
    {
        let jump_direction = null;
        //go left
        if (
            (  ( direction !== null && direction == swipeGestureRecognizer.DIRECTION_LEFT ) ||
             key_left.isDown
             ) &&
            train.rail > 0
            )
        {
            is_changing_rail = true;
            if (!train.sternphase)
                train.animations.play("jump_left");
            jump_direction = -1;
            
            //go right
        } else if (
                   (  ( direction !== null &&  direction == swipeGestureRecognizer.DIRECTION_RIGHT ) ||
                    key_right.isDown
                    ) &&
                   train.rail < 2
                   )
        {
            is_changing_rail = true;
            if (!train.sternphase)
                train.animations.play("jump_right");
            jump_direction = +1;
        }
        
        if (is_changing_rail)
        {
            train.geschw_x = jump_direction/rail_jump_duration;
            new_train_rail = train.rail + jump_direction;
            last_rail_jump_start = t;
            last_key_change_time = t;
            can_change_rail = false;
            can_jump_up = false;
            train.rail = -1;
            train.last_x = train.x;
            train.last_y = train.y;
            jump.play();
        }
    }
    
    // check if train should jump up
    if (train.rail !== -1 &&
        t-last_key_change_time>key_change_rate
        )
    {
        if (  ( direction !== null && direction == swipeGestureRecognizer.DIRECTION_UP ) ||
            key_up.isDown
            )
        {
            is_jumping_up = true;
            new_train_rail = train.rail;
            last_up_jump_start = t;
            train.rail = -1;
            can_jump_up = false;
            jump.play();
        }
    }
    
    if (is_jumping_up) {
        let dt = (t-last_up_jump_start);
        if (dt < up_jump_duration) {
            let a = 1/300.;
            train.y = train_std_y - dt*up_jump_duration*a + Math.pow(dt,2)*a;
        } else {
            train.y = train_std_y;
            train.rail = new_train_rail;
            can_change_rail = true;
            can_jump_up = true;
            is_jumping_up = false;
            if (!train.sternphase)
                train.animations.play(train_animations[train.rail]);
        }
    }
    
    // rail change animation
    if (is_changing_rail) {
        let dt = (t-last_rail_jump_start);
        if (dt < rail_jump_duration) {
            train.x = train.last_x + distance_between_train_positions*train.geschw_x * dt;
            let a = 1/500.;
            train.y = train_std_y - dt*rail_jump_duration*a + Math.pow(dt,2)*a;
        } else {
            train.x = train_position[new_train_rail];
            train.y = train_std_y;
            train.rail = new_train_rail;
            can_change_rail = true;
            can_jump_up = true;
            is_changing_rail = false;
            if (!train.sternphase)
                train.animations.play(train_animations[train.rail]);
        }
    }
    
    // ====================== UPDATING RAIL AND BAHNDAMM OBJECTS ===================
    
    // for saving the indices of objects being out of scope
    let remove_indices = Array();
    let remove_bahndamm_indices = Array();
    
    // loop trough all rail objects
    for (let i = 0; i < railObjects.length; i++)
    {
        // update according to new time
        // pass the train object to see if there's a collision
        updateRailObject(railObjects[i],train);
        
        // remove if the object is now out of scope
        if (!railObjects[i].active) {
            remove_indices.push(i);
            if (railObjects[i].kind == "stern") {
                can_spawn_new_star = true;
            }
        }
        
        // if there's a collision with the train
        if (railObjects[i].collision) {
            
            // set a new starting point for this object
            // both in time and space
            railObjects[i].t0 = t;
            railObjects[i].x_s = railObjects[i].sprite.x;
            railObjects[i].y_s = railObjects[i].sprite.y;
            
            // save direction of the object in case
            // it's a wall and has to fly somewhere
            let leftRight;
            if(railObjects[i].rail == 0) {
                leftRight = 1;
            } else if(railObjects[i].rail == 1) {
                leftRight = 1-2*Math.floor(Math.random()*2);
            } else if(railObjects[i].rail == 2) {
                leftRight = -1;
            }
            
            railObjects[i].direction = leftRight;
            
            // give this object to the collision updates
            collisionObjects.push(railObjects[i]);
        }
    }
    
    // update all Bahndamm objects in a similar manner
    for (let i = 0; i < bahndammObjects.length; i++)
    {
        updateRailObject(bahndammObjects[i],train);
        if (!bahndammObjects[i].active) {
            remove_bahndamm_indices.push(i);
        }
    }
    
    // loop through collision objects
    let collision_indices = Array();
    
    for (let i=0; i<collisionObjects.length; i++) {
        
        // update according to their logic
        collisionUpdate(collisionObjects[i],train);
        
        // remove if collision animation is over (set in collisionUpdate())
        if (!collisionObjects[i].collision) {
            collision_indices.push(i);
        }
    }
    
    // delete all objects that are out of scope or have been collected
    delete_indices_from_array(remove_indices,railObjects);
    delete_indices_from_array(collision_indices,collisionObjects);
    delete_indices_from_array(remove_bahndamm_indices,bahndammObjects);
    
    // ========================= SPAWNING NEW OBJECTS ============================
    //
    if (t - last_rail_object_time > new_rail_object_rate) {
        
        let kind = 'coin';
        let random_float = Math.random();
        
        // there's different objects if the train is in sternphase
        if (!train.sternphase){
            if (can_spawn_new_star) {
                if (random_float < 1) {
                    kind = 'stern';
                    can_spawn_new_star = false;
                }
            }
            else if (random_float < 0.3) {
                kind = 'wall';
            } else {
                kind = 'coin';
            }
        } else {
            if (random_float < 0.2) {
                kind = 'trumpwall';
            }
            else if (random_float < 0.4) {
                kind = 'fraukewall';
            } else {
                kind = 'coin';
            }
            
        }
        
        railObjects.push(getRailObject(kind));
        
        // bring the older objects to the top again
        for (var i = railObjects.length; i--; ) {
            railObjects[i].sprite.bringToTop();
        }
        
        last_rail_object_time = t;
    }
    
    //spawn new bahndamm objects
    
    for (var kind in bahndamm_probabilities) {
        // skip loop if the property is from prototype
        if (!bahndamm_probabilities.hasOwnProperty(kind)) continue;
        var prob = bahndamm_probabilities[kind];
        if (Math.random() < prob) {
            bahndammObjects.push(getBahndammObject(kind));
            
            for (var i = bahndammObjects.length; i--; ) {
                bahndammObjects[i].sprite.bringToTop();
            }
        }
    }

    for (var i = 0; i<star_objects.length; i++) {
        star_objects[i].sprite.bringToTop();
    }
    
    //spawn new clouds
    if (Math.random() < 0.01)
        generateCloud();
    
    // update statistics
    meter_counter += dt*v/1000;
    
    text_score.x = Math.floor(panel.x + panel.width / 4 + 16);
    text_score.y = Math.floor(panel.y + panel.height / 2 + 4);
    text_score.setText(nFormatter(Math.floor(coin_counter), 2));
    text_score.font = 'SilkScreen';
    
    text_distance.x = Math.floor(panel.x + panel.width / 4 * 3 + 1);
    text_distance.y = Math.floor(panel.y + panel.height / 2 + 4);
    text_distance.setText(nFormatter(Math.floor(meter_counter), 2) + "m");
    text_distance.font = 'SilkScreen';
}

function nFormatter(num, digits) {
    let si = [
              { value: 1E18, symbol: "E" },
              { value: 1E15, symbol: "P" },
              { value: 1E12, symbol: "T" },
              { value: 1E9,  symbol: "G" },
              { value: 1E6,  symbol: "M" },
              { value: 1E3,  symbol: "k" }
              ], rx = /\.0+$|(\.[0-9]*[1-9])0+$/, i;
    for (i = 0; i < si.length; i++) {
        if (num >= si[i].value) {
            return (num / si[i].value).toFixed(digits).replace(rx, "$1")
            + si[i].symbol;
        }
    }
    return num.toFixed(digits).replace(rx, "$1");
}


function generateCloud() {
    let seed = Math.random();
    let cloud_height = seed * 176;
    let cloud_type = 'cloud0';
    if (seed < 0.667) {
        cloud_type = 'cloud1';
    } else if (seed < 0.333) {
        cloud_type = 'cloud2';
    } else {
        cloud_type = 'cloud0';
    }
    let cloud = cloudObjectGroup.create(-60, cloud_height, cloud_type);
    game.physics.arcade.enable(cloud);
    cloud.body.gravity.x = 4;
}

function delete_indices_from_array(indices,array){
    // delete object from railObjects updated
    for (let i = indices.length - 1; i >= 0; i--)
        array.splice(indices[i], 1);
}

function collisionUpdate(object,train) {
    if (object.kind == "coin") {
        bling.play();
        object.sprite.destroy();
        update_coin_counter(1,object.sprite.position);
        object.collision = false;
    }
    
    if (object.kind == "stern") {
        let dt = current_time - object.t0;
        if (dt>sternphase_duration) {
            //train.animations.play(train_animations[train.rail]);
            v = std_v;
            new_rail_object_rate = std_new_rail_object_rate;
            new_bahndamm_object_rate = std_new_bahndamm_object_rate;
            train.sternphase = false;
            object.collision = false;
            train.animations.play(train_animations[train.rail]);
            train.indefeatable = false;
        }else if (dt === 0.){

            //gameplay actions
            sternsound.play()
            update_coin_counter(10,object.sprite.position);

            //set new object properties
            new_pos = get_next_eu_star_position();
            object.sprite.anchor.setTo(0.5,0.5);
            object.angle_index = new_pos.angle_index;
            //object.sprite.x = new_pos.x;
            //object.sprite.y = new_pos.y;
            let new_scale = raildistance_inner*1.5 / object.original_object_height;
            //object.sprite.scale.setTo(new_scale,new_scale);
            star_objects.push(object);
            let autoStart = false;
            let delay = 0;

            let sky_travel = game.add.tween(object.sprite).to(
                                            { 
                                               x: new_pos.x, 
                                               y: new_pos.y
                                            },
                                            eu_star_travel_time,
                                            Phaser.Easing.Cubic.Out,
                                            autoStart,
                                            delay
                                            );
            let sky_scale = game.add.tween(object.sprite.scale).to(
                                            { 
                                               x: new_scale, 
                                               y: new_scale
                                            },
                                            eu_star_travel_time,
                                            Phaser.Easing.Cubic.Out,
                                            autoStart,
                                            delay
                                            );

            if (new_pos.is_last_star) {
                can_spawn_new_star = false;
                sky_travel.onComplete.add(eu_flag_complete_event);
            } else {
                can_spawn_new_star = true;
            }
                

            sky_travel.start();
            sky_scale.start();
            //old:object.sprite.destroy();

            //set train properties
            train.indefeatable = false;
            train.sternphase = true;
            train.animations.play("stern");

            //velocities
            v = std_v * sternphase_factor;
            new_rail_object_rate = std_new_rail_object_rate / sternphase_factor;
            new_bahndamm_object_rate = std_new_bahndamm_object_rate / sternphase_factor;

        }
    }
    
    if (train.sternphase) {
        if (object.kind == "wall" || object.kind == "fraukewall" || object.kind == "trumpwall") {
            let dt = current_time - object.t0;
            if (dt>mauer_animation_length) {
                object.sprite.destroy();
                object.collision = false;
                train.indefeatable = false;
            } else if (dt === 0.) {
                smash.play();
                notifyObjetciveC("smashed-wall");
                update_coin_counter(10);
            } else{
                object.sprite.x = object.x_s + object.direction * dt;
                object.sprite.y = object.y_s - dt / 100. + Math.pow(dt,2)/1000.;
                object.sprite.angle = object.direction*dt/5;
            }
        }
    }  else {
        if (object.kind == "wall" || object.kind == "fraukewall" || object.kind == "trumpwall") {
            let dt = current_time - object.t0;
            if (dt>mauer_animation_length) {
                object.sprite.destroy();
                object.collision = false;
                train.animations.play(train_animations[train.rail]);
                train.indefeatable = false;
            }else if (dt === 0.){
                smash.play();
                notifyObjetciveC("smashed-wall");
                if (coin_counter >= 10) {
                    coin_counter -= 10;
                } else {
                    coin_counter = 0;
                }
            }else{
                train.animations.play("collision");
                object.sprite.x = object.x_s + object.direction * dt;
                object.sprite.y = object.y_s - dt / 100. + Math.pow(dt,2)/1000.;
                object.sprite.angle = object.direction*dt/5;
                train.indefeatable = true;
            }
        }
    }
}


function flip_z(z) {
    return height - z;
}

function flip_x(x) {
    return width - x;
}

function getBahndammObject(kind)
{
    //get spawn rail
    let seite = Math.floor(Math.random() * 2);
    //get corresponding starting position
    let damm_width = width / 2 - 1.5*raildistance_outer - raildistance_inner-35;
    let damm_offset = seite * (width / 2 + 1.5*raildistance_outer + raildistance_inner + 35);
    let x_s = damm_width * Math.random() + damm_offset;
    let h_object;
    let w_object;
    let original_object_height;
    
    let sprite = railObjectGroup.create(0, 0, kind);
    
    if (kind == "tree0") {
        h_object = 40;
    }
    if (kind == "tree1") {
        h_object = 35;
    }
    if (kind == "tree2") {
        h_object = 35;
    }
    if (kind == "bush") {
        h_object = 10;
    }
    if (kind == "sign") {
        h_object = 20;
    }
    if (kind == "frauke") {
        h_object = 25;
    }
    if (kind == "trump") {
        h_object = 25;
    }
    
    
    sprite.anchor.setTo(0.5, 0.5);
    
    //set start x-value
    sprite.x = x_s;
    //flip_z is necessary due to different orientation of screen coordinates
    sprite.y = flip_z(horizon + h_object / 2);
    
    //get the original height of the object to scale it to the wanted heifht
    original_object_height = sprite.height;
    original_object_width = sprite.width;
    
    //get and set new scale
    let new_scale = h_object / original_object_height;
    sprite.scale.setTo(new_scale, new_scale);
    w_object = sprite.width;
    
    let railObject = {
        "kind": kind,
        "rail": -1,
        "sprite": sprite,
        "original_object_height": original_object_height,
        "original_object_width": original_object_width,
        "t0": current_time,
        "active": true,
        "w_object": w_object,
        "h_object": h_object,
        "x_s": x_s,
        "y": 0,
        "collision": false
    };
    
    return railObject;
}

function getRailObject(kind)
{
    //get spawn rail
    let rail = Math.floor(Math.random() * 3);
    //get corresponding starting position
    let x_s = width / 2 - raildistance_outer - raildistance_inner + rail * (raildistance_outer + raildistance_inner);
    let h_object;
    let w_object;
    let original_object_height;
    let original_object_width;
    
    let sprite = railObjectGroup.create(0, 0, kind);
    
    if (kind == 'wall') {
        h_object = raildistance_inner*0.8;
    }
    
    if (kind == 'fraukewall') {
        h_object = raildistance_inner * 1.5;
    }
    
    if (kind == 'trumpwall') {
        h_object = raildistance_inner* 1.55;
    }
    
    if (kind == 'stern') {
        h_object = raildistance_inner;
    }
    
    if (kind == 'coin') {
        h_object = raildistance_outer;
        
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
    
    sprite.anchor.setTo(0.5, 0.5);
    
    //set start x-value
    sprite.x = x_s;
    //flip_z is necessary due to different orientation of screen coordinates
    sprite.y = flip_z(horizon + h_object / 2);
    
    //get the original height of the object to scale it to the wanted heifht
    original_object_height = sprite.height;
    original_object_width = sprite.width;
    
    //get and set new scale
    let new_scale = h_object / original_object_height;
    sprite.scale.setTo(new_scale, new_scale);
    w_object = sprite.width;
    
    let railObject = {
        "kind": kind,
        "rail": rail,
        "sprite": sprite,
        "original_object_height": original_object_height,
        "original_object_width": original_object_width,
        "t0": game.time.now,
        "y": 0,
        "active": true,
        "w_object": w_object,
        "h_object": h_object,
        "x_s": x_s,
        "collision": false
    };
    
    return railObject;
}

function updateRailObject(object,schulzzug) {
    
    //get current time
    let t = game.time.now;
    let dt = t - object.t0;
    object.t0 = t;
    //object.sprite.anchor.setTo(0.5,0.5);
    
    //get position between horizon and camera
    let y = object.y + v * dt;
    object.y = y;
    
    //get center position of test object
    let x_o = x_camera - L / (L - y) * (x_camera - object.x_s);
    
    //set center position of object
    object.sprite.x = x_o;
    
    //get new width
    let w = -L * ((x_camera - (object.x_s + object.w_object / 2)) / (L - y) - (x_camera - (object.x_s - object.w_object / 2)) / (L - y));
    
    //get and set new scale of object
    let wScale = w / object.original_object_width;
    object.sprite.scale.setTo(wScale);
    
    //get vertical coordinate
    let h = h_camera - L / (L - y) * (h_camera - object.h_object / 2) + horizon;
    object.sprite.y = flip_z(h);
    
    //get collision range
    //destroy if out of scope
    if (y > L)
    {
        object.sprite.destroy();
        object.active = false;
    }
    
    if (y>y_collision_begin_range && y<y_collision_end_range && !schulzzug.indefeatable) {
        if (object.rail == schulzzug.rail) {
            object.collision = true;
            object.active = false;
        }
    }
}

function notifyObjetciveC(notifciation) {
    if(IOS_MODE) {
        var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", "ios-js://"+notifciation);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    }
}

function activateIosMode() {
    IOS_MODE = true;
}

function update_coin_counter(coins,pos) {
    coin_counter += coins;
}

function eu_flag_complete_event() {
    let new_eu_radius = height/4.;
    let new_height = width/3.;
    let new_eu_pos = { 
       x: width/2,
       y: height+new_eu_radius+ new_height/2.
    };

    for(var i=N_eu_stars-1; i>=0; i--) {
        let s = star_objects[i];
        let angle = get_angle_from_index(s.angle_index);
        let new_pos = {
            x: new_eu_pos.x + new_eu_radius * Math.cos(angle),
            y: new_eu_pos.y + new_eu_radius * Math.sin(angle)
        };
        let new_scale = new_height / s.original_object_height;
        let new_alpha = 0;
        let autoStart = false;
        let delay = sternphase_duration - eu_star_travel_time;

        //let s_pulse = game.add.tween(

        let s_travel = game.add.tween(s.sprite).to(
                        {
                            alpha: new_alpha,
                            x: new_pos.x,
                            y: new_pos.y
                        },
                        eu_star_travel_time,
                        Phaser.Easing.Cubic.In,
                        autoStart,
                        delay
                        );
        let s_scale = game.add.tween(s.sprite.scale).to(
                        {
                            x: new_scale,
                            y: new_scale
                        },
                        eu_star_travel_time,
                        Phaser.Easing.Cubic.In,
                        autoStart,
                        delay
                        );
        if (i==0) {
            s_travel.onComplete.add( function (target,tween) {
                target.destroy();
                let v_scale = std_v / (std_v+delta_v_eu_event);
                std_v += delta_v_eu_event;
                v = std_v;
                std_new_rail_object_rate *= v_scale;
                std_new_bahndamm_object_rate *= v_scale;
                new_rail_object_rate = std_new_rail_object_rate;
                new_bahndamm_object_rate = std_new_bahndamm_object_rate;
                can_spawn_new_star = true;
            });
        } else {
            s_travel.onComplete.add( function (target,tween) {
                target.destroy();
            });
        }
        star_objects.pop();

        s_travel.start();
        s_scale.start();
    }
}

function get_next_eu_star_position() {
    let idx = Math.floor(Math.random()*eu_stars_indices.length);
    let i_phi = eu_stars_indices[idx];
    eu_stars_indices.splice(idx,1);
    let angle = get_angle_from_index(i_phi);
    let new_pos = {
        x: eu_pos.x + eu_radius * Math.cos(angle), 
        y: eu_pos.y + eu_radius * Math.sin(angle),
        is_last_star: false,
        angle_index: i_phi
    };

    if (eu_stars_indices.length === 0) {
        new_pos.is_last_star = true;
        for(var i=0; i<N_eu_stars; i++)
            eu_stars_indices.push(i);
    }

    return new_pos;
}

function get_angle_from_index(i_phi) {
    let angle = (d_phi * i_phi - 90) / 180 * Math.PI;
    return angle;
}
