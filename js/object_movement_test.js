
// canvas size
const width = 375;
const height = 667;

// object to be displayed (coin and such)
let object;

// position of horizon on y-axis
const horizon = height - 210;

// Schulzzuggeschwindigkeit
let v = 10;

// distance to horizon
let L = 40000;

// height of camera
let h_camera = 50;

// x position of camera
let x_camera = width / 2;

// distances of rails
let raildistance_inner = 10;
let raildistance_outer = 6;

// height/width of test object
let h_object = raildistance_inner;
let w_object;

//start coordinate of test object
let x_s = width / 2 - raildistance_outer - raildistance_inner;

// graphics object for lines
let gfx;

// game engine
let game = new Phaser.Game(width, height, Phaser.AUTO, 'phaser-game', { preload: preload, create: create, update: update });

// after that time, movement will start
let t0;

let new_rail_object_rate = 500;
let last_rail_object_time;

function preload() {
    game.load.image('dummy',      'assets/1pixel.png');
    game.load.image('tree0',      'assets/Tree01.50.png');
    game.load.image('tree1',      'assets/Tree02.50.png');
    game.load.spritesheet('train','assets/Train.52.png', 120, 232);
    game.load.image('landscape',  'assets/untergrund.50.png');
    game.load.image('office',     'assets/Kanzleramt.50.png');
    game.load.image('bush',       'assets/Bush01.50.png');
    game.load.image('sign',       'assets/Sign01.50.png');
    game.load.spritesheet('coin', 'assets/Coin.50.png', 32, 32);
}

let original_object_height;
let railObjectGroup;
let railObjects = Array();

// create scenery
function create() {

    //add for gleise
    gfx = game.add.graphics(0, 0); 
    gfx.lineStyle(1, 0xff0000, 1);

    railObjectGroup = game.add.group();


    game.physics.startSystem(Phaser.Physics.ARCADE);
    last_rail_object_time = game.time.now;
    //schulzzug
    //
    //
    //add test object
    //
    /*
    object = game.add.sprite(0,0,'dummy');
    object.anchor.setTo(0.5,0.5);

    //set start x-value
    object.x = x_s;
    //flip_z is necessary due to different orientation of screen coordinates
    object.y = flip_z(horizon + h_object/2);

    //get the original height of the object to scale it to the wanted heifht
    original_object_height = object.height;

    //get and set new scale
    let new_scale = h_object / original_object_height;
    object.scale.setTo(new_scale,new_scale);
    w_object = object.width;
    

    //set object start time to now
    t0 = game.time.now;
    */
    //railObjects.push( getRailObject("dummy"));
    //console.log(railObjects);
    draw_rails(); 

}

function draw_rails() {

    let t0;

    let x_start = width / 2 - 1.5 * raildistance_inner - raildistance_outer;
    //vr linedd.graphics(x, y);1 = Phaser.Line(this_x_start,horizon,x_L,h);
    let y_g = height / 2 * L / (h_camera+height / 2);
    
    for(let rail = 0; rail < 3; rail++)
    {
        let this_x_start = x_start + rail * (raildistance_inner + raildistance_outer);
        let x_L = x_camera - L * (x_camera - this_x_start) / (h_camera - (L - y_g));
        let x_R = x_camera - L * (x_camera - (this_x_start + raildistance_inner)) / (h_camera - (L - y_g));
        let h = h_camera - L / (L - y_g) * h_camera + horizon;
        
        /*
        console.log("h =", h);
        console.log("y_g=",y_g);

        console.log(this_x_start,horizon,x_L,h);
        console.log(this_x_start,x_L,horizon);
        console.log(horizon);
        console.log(x_L);
        console.log(x_L);
        console.log(x_R);
        */
        
        gfx.moveTo(this_x_start, flip_z(horizon));
        gfx.lineTo(flip_x(x_L), flip_z(h));
        gfx.moveTo(this_x_start + raildistance_inner, flip_z(horizon));
        gfx.lineTo(flip_x(x_R), flip_z(h));
        
        //let line1 = Phaser.Line(this_x_start,horizon,x_L,h);
        //gleis_lines.push(new Phaser.Line(this_x_start,horizon,x_L,h));
        //gleis_lines.push(new Phaser.Line(this_x_start+raildistance_inner,flip_z(horizon),x_R,flip_z(h)));
        
    }
}

function update() {
    t = game.time.now;

    let remove_indices = Array();

    for (let i = 0; i < railObjects.length; i++)
    {
        updateRailObject(railObjects[i]);
        if (!railObjects[i].active)
            remove_indices.push(i);
    }

    for (let i = remove_indices.length - 1; i >= 0; i--)
        railObjects.splice(remove_indices[i], 1);


    if (t - last_rail_object_time > new_rail_object_rate) {
        railObjects.push(getRailObject("dummy"));
        last_rail_object_time = t;
    }
}

function flip_z(z) {
    return height - z;
}

function flip_x(x) {
    return width - x;
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

    if (kind == "dummy") {
        h_object = raildistance_inner;
    }

    let sprite = railObjectGroup.create(0, 0, 'coin');
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
        "rail": rail,
        "sprite": sprite,
        "original_object_height": original_object_height,
        "original_object_width": original_object_width,
        "t0": game.time.now,
        "active": true,
        "w_object": w_object,
        "h_object": h_object,
        "x_s": x_s
    };

    return railObject;
}

function updateRailObject(object) {

    //get current time
    t = game.time.now;
    //object.sprite.anchor.setTo(0.5,0.5);

    //get position between horizon and camera
    let y = v * (t-object.t0);

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
    
    //destroy if out of scope
    if (y > L) 
    {
        object.sprite.destroy()
        object.active = false;
    }
}
