"use strict";
// ===================== DEFINE WORLD CONSTANTS ================================
// canvas size (half iphone 7 retina resolution)
const canvas_width = 375;
const canvas_height = 667;

// position of horizon on y-axis
const horizon_height = 208;
const horizon = canvas_height - horizon_height;

// distance to horizon
const horizon_distance = 40000;

// height of camera
const camera_height = 50;

// x position of camera
const camera_x = canvas_width / 2;

// distances of rails at horizon
const rail_distance_inner = 10;
const rail_distance_outer = 6;

// schulzzug velocity
let v_initial = 10;          // default velocity for the whole game
let v_default = v_initial;  // default velocity for the current level
let v = v_default;   // current velocity

//collision ranges
const y_collision_range_start
= canvas_height / 2 * horizon_distance
/ (camera_height + canvas_height / 2);
const y_collision_range_end = y_collision_range_start + 2000;

// ====================== EU STAR STUFF ========================================
const eu_radius = horizon_height / 4;
const eu_position = {
    'x': canvas_width / 2,
    'y': horizon_height / 2
};
const eu_stars_count = 12;
const delta_phi = 360 / eu_stars_count;
let eu_stars_indices = Array();
for (let i = 0; i < eu_stars_count; i++) {
    eu_stars_indices.push(i);
}
let eu_star_objects = Array();
const eu_star_travel_time = 1000;
let eu_star_can_spawn = true;
const eu_event_delta_v = 5;

// each time it's possible, a star will appear
const eu_star_appearance_probability_level_infinite = .1; // std: 0.1, debug: 1.0
const eu_star_appearance_probability_level_zero = .3; // std: 0.1, debug: 1.0
function eu_star_appearance_probability () {
    let dp = eu_star_appearance_probability_level_zero - eu_star_appearance_probability_level_infinite;
    return eu_star_appearance_probability_level_infinite + dp * Math.pow(0.8,current_level);
}

// ===================== STERNPHASE DEFINTIIONS ================================
const eu_star_phase_duration = 8000; // std: 8000, debug: 4000
//const eu_star_phase_factor = 2; --> this is now a function in core (dynamically from level)
let last_eu_star_collision_time = 0;

// ===================== DEFINE CONTROL VARIABLES ==============================
// swipe handling
let IOS_MODE;
var swipe_direction;
let swipe_gesture_recognizer;

// input keys
let key_left;
let key_esc;
let key_right;
let key_up;
let key_space;
let key_mute;

// time after which a new control command can be given (ms)
const key_change_time_block = 200;
let key_mute_block = key_change_time_block;

// last time a control command was given
let key_change_time;

// ====================== RAIL AND DAM OBJECT PROPERTIES =======================

// rate of rail object appearance
let rail_object_rate_default = 500;

// this is needed for changes in velocity
let rail_object_rate = rail_object_rate_default;

//time of last appearance
let rail_object_time;

let dam_object_rate_default = 150;

// the current rate (changes when there's changes in velocity)
let dam_object_rate = dam_object_rate_default;

// time of last dam object appearance
let dam_object_time;
let dam_probabilities;

//let rail_standard_object_probabilities;
//let rail_sternphase_object_probabilities;
let populist_probabilities;


// objects for storing arrays and sprite groups:
// - for creating an object sprite in the right rail group
let rail_object_group;
// - storing the rail objects,
//   s.t. they can be updated while approaching the train
let rail_objects = Array();
// - storing the collision objects,
//   s.t. they can be updated when a collision took place
let collision_objects = Array();
// - same for dam objects
let dam_objects = Array();
// - same for cloud objects
let cloud_object_group;


// ====================== STATS COUNTERS =======================================
let coin_counter = 0;
let meter_counter = 0;
let panel;          // sprite
let text_score;     // label
let text_distance;  // label


// ==================== SCHULZZUG DEFINITIONS ==================================
let train;          // sprite

// positions of sprite for the three rails
let train_position = [ -10, (canvas_width - 120) / 2, canvas_width - 120 + 10 ];
const train_position_distance = 130;

// names of the animation for each rail
let train_animations  = ["train_left", "train_center", "train_right"];

let train_star_animations = ["star_left", "star_center", "star_right"];

let train_collision_animations = ["collision_left", "collision_center", "collision_right"];

// this is false if the train jumps
let rail_can_change = true;

// this is only true if the train is currently changing its rail
let rail_is_changing = !rail_can_change;

// time the train needs to jump
let rail_jump_duration = key_change_time_block;

// when the last jump started
let rail_jump_start;

// the next train rail after finishing the rail jump (0, 1 or 2)
let train_rail_next;

let train_can_jump_up = true;
let train_is_jumping_up = !train_can_jump_up;
const train_up_jump_duration = 400;
let train_up_jump_start;

// the usual distance to the top of the screen.
const train_spacing_y = 360;

// ================= SOUNDS ====================================================
let sound_bling;
let sound_smash;
let sound_jump;
let sound_tada;
let sound_whistle;
let sound_background;
let sound_eu_star;
let sound_bg_music;
let sound_bg_menu;
let bg_music_bpm = 120; //the bg_music has 120 BPM (beats per minute)

// ============================ COLLISIONS =====================================
const wall_coin_penalty = -50;
const eu_wall_collision_reward = 10;
const wall_animation_length = 2000;
const time_until_full_velocity = 8000;
let last_velocity_scale_time;
let last_velocity_scale = 1;
let last_scale_event = "default";
const collision_velocity_drop_ratio = 0.3;
let last_bad_wall_collision_time = 0;


// ===================== SAVING CURRENT TIME FOR ANIMATIONS ====================
let time_now;
let time_last;
let firebase_submission_time;
const firebase_submission_delay = 15000;

// state transitions

let state_transition_duration = 1000;
let is_fading_to_next_level = false;

let last_esc_use_time;

// =========================== COIN MENU NOTIFICATION ==========================
let used_coin_menu_already = false;
let total_lost_coins = 0;
const lost_coins_at_which_to_start_notifying = 200;
const min_coins_at_which_to_start_notifying = 100;
//let coin_notifier;

let flying_coin_group;
var is_android = false;
