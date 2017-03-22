"use strict";
/**
 * Created by flogvit on 2015-11-03.
 *
 * @copyright Cellar Labs AS, 2015, www.cellarlabs.com, all rights reserved
 * @file
 * @license MIT
 * @author Vegard Hanssen <Vegard.Hanssen@cellarlabs.com>
 *
 */


function Swipe(game, model) {
  let self = this;

  self.DIRECTION_UP = 1;
  self.DIRECTION_DOWN = 2;
  self.DIRECTION_LEFT = 4;
  self.DIRECTION_RIGHT = 8;
  self.DIRECTION_UP_RIGHT = 16;
  self.DIRECTION_UP_LEFT = 32;
  self.DIRECTION_DOWN_RIGHT = 64;
  self.DIRECTION_DOWN_LEFT = 128;

  self.game = game;
  self.model = model !== undefined ? model : null;
  self.dragLength = 15;
  self.diagonalDelta = 3;
  self.swiping = false;
  self.direction = null;
  self.tmpDirection = null;
  self.tmpCallback = null;
  self.diagonalDisabled = true;
  self.last_direction = null;
  self.last_active_position = { "x": 0, "y": 0};
  self.last_event_time = game.time.now;
  self.next_event_rate = null;

  this.game.input.onDown.add(function () {
    self.swiping = true;
    self.last_direction = null;
    self.last_active_position.x = self.game.input.activePointer.positionDown.x;
    self.last_active_position.y = self.game.input.activePointer.positionDown.y;
  });
  this.game.input.onUp.add(function () {
    self.swiping = false;
    self.last_direction = null;
    self.last_active_position = {"x": 0, "y":0};
  })

  this.setupKeyboard();
}

Swipe.prototype.setupKeyboard = function() {
  let self = this;
  let up = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
  up.onDown.add(function () {
    if (self.tmpDirection !== null) {
      switch(self.tmpDirection) {
        case self.DIRECTION_LEFT:
          self.direction = self.DIRECTION_UP_LEFT;
          self.model !== null && self.model.upLeft && self.model.upLeft();
          break;
        case self.DIRECTION_RIGHT:
          self.direction = self.DIRECTION_UP_RIGHT;
          self.model !== null && self.model.upRight && self.model.upRight();
          break;
        default:
          self.direction = self.DIRECTION_UP;
          self.model !== null && self.model.up && self.model.up();
      }
      self.tmpDirection = null;
      self.tmpCallback = null;
    } else {
      self.tmpDirection = self.DIRECTION_UP;
      self.tmpCallback = self.model !== null && self.model.up ? self.model.up : null;
    }
  })
  up.onUp.add(this.keyUp, this);

  let down = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
  down.onDown.add(function () {
    if (self.tmpDirection !== null) {
      switch(self.tmpDirection) {
        case self.DIRECTION_LEFT:
          self.direction = self.DIRECTION_DOWN_LEFT;
          self.model !== null && self.model.downLeft && self.model.downLeft();
          break;
        case self.DIRECTION_RIGHT:
          self.direction = self.DIRECTION_DOWN_RIGHT;
          self.model !== null && self.model.downRight && self.model.downRight();
          break;
        default:
          self.direction = self.DIRECTION_DOWN;
          self.model !== null && self.model.down && self.model.down();
      }
      self.tmpDirection = null;
      self.tmpCallback = null;
    } else {
      self.tmpDirection = self.DIRECTION_DOWN;
      self.tmpCallback = self.model !== null && self.model.down ? self.model.down : null;
    }
  })
  down.onUp.add(this.keyUp, this);

  let left = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
  left.onDown.add(function () {
    if (self.tmpDirection !== null) {
      switch(self.tmpDirection) {
        case self.DIRECTION_UP:
          self.direction = self.DIRECTION_UP_LEFT;
          self.model !== null && self.model.upLeft && self.model.upLeft();
          break;
        case self.DIRECTION_DOWN:
          self.direction = self.DIRECTION_DOWN_LEFT;
          self.model !== null && self.model.downLeft && self.model.downLeft();
          break;
        default:
          self.direction = self.DIRECTION_LEFT;
          self.model !== null && self.model.left && self.model.left();
      }
      self.tmpDirection = null;
      self.tmpCallback = null;
    } else {
      self.tmpDirection = self.DIRECTION_LEFT;
      self.tmpCallback = self.model !== null && self.model.left ? self.model.left : null;
    }
  })
  left.onUp.add(this.keyUp, this);
  let right = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
  right.onDown.add(function () {
    if (self.tmpDirection !== null) {
      switch(self.tmpDirection) {
        case self.DIRECTION_UP:
          self.direction = self.DIRECTION_UP_RIGHT;
          self.model !== null && self.model.upRight && self.model.upRight();
          break;
        case self.DIRECTION_DOWN:
          self.direction = self.DIRECTION_DOWN_RIGHT;
          self.model !== null && self.model.downRight && self.model.downRight();
          break;
        default:
          self.direction = self.DIRECTION_RIGHT;
          self.model !== null && self.model.right && self.model.right();
      }
      self.tmpDirection = null;
      self.tmpCallback = null;
    } else {
      self.tmpDirection = self.DIRECTION_RIGHT;
      self.tmpCallback = self.model !== null && self.model.right ? self.model.right : null;
    }
  })
  right.onUp.add(this.keyUp, this);
}

Swipe.prototype.keyUp = function() {
  this.direction = this.tmpDirection;
  this.tmpDirection = null;
  if (this.tmpCallback !== null) {
    this.tmpCallback.call(this.model);
    this.tmpCallback = null;
  }
}

Swipe.prototype.check = function () {
  let t = this.game.time.now;

  if (this.direction !== null) {
    let result = {x: 0, y: 0, direction: this.direction};
    this.direction = null;
    return result;
  }
  if (!this.swiping) return null;

  if (t-this.last_event_time < this.next_event_rate) {
      this.updated_active_position = false;
      return null;
  }
  else if (t-this.last_event_time > this.next_event_rate &&
           !this.updated_active_position)
           {
      this.last_active_position.x = this.game.input.activePointer.position.x;
      this.last_active_position.y = this.game.input.activePointer.position.y;
      this.updated_active_position = true;

  }


  if (Phaser.Point.distance(this.game.input.activePointer.position, this.last_active_position) < this.dragLength) return null;

  let direction = null;
  let deltaX = this.game.input.activePointer.position.x - this.last_active_position.x;
  let deltaY = this.game.input.activePointer.position.y - this.last_active_position.y;

  let result = {
    x: this.last_active_position.x,
    y: this.last_active_position.y
  };

  let deltaXabs = Math.abs(deltaX);
  let deltaYabs = Math.abs(deltaY);

  if (!this.diagonalDisabled && deltaXabs > (this.dragLength-this.diagonalDelta) && deltaYabs > (this.dragLength-this.diagonalDelta)) {
    if (deltaX > 0 && deltaY > 0) {
      direction = this.DIRECTION_DOWN_RIGHT;
      this.model !== null && this.model.downRight && this.model.downRight(result);
    } else if (deltaX > 0 && deltaY < 0) {
      direction = this.DIRECTION_UP_RIGHT;
      this.model !== null && this.model.upRight && this.model.upRight(result);
    } else if (deltaX < 0 && deltaY > 0) {
      direction = this.DIRECTION_DOWN_LEFT;
      this.model !== null && this.model.downLeft && this.model.downLeft(result);
    } else if (deltaX < 0 && deltaY < 0) {
      direction = this.DIRECTION_UP_LEFT;
      this.model !== null && this.model.upLeft && this.model.upLeft(result);
    }
  } else if (deltaXabs > this.dragLength || deltaYabs > this.dragLength) {
    if (deltaXabs > deltaYabs) {
      if (deltaX > 0) {
        direction = this.DIRECTION_RIGHT;
        this.model !== null && this.model.right && this.model.right(result);
      } else if (deltaX < 0) {
        direction = this.DIRECTION_LEFT;
        this.model !== null && this.model.left && this.model.left(result);
      }
    } else {
      if (deltaY > 0) {
        direction = this.DIRECTION_DOWN;
        this.model !== null && this.model.down && this.model.down(result);
      } else if (deltaY < 0) {
        direction = this.DIRECTION_UP;
        this.model !== null && this.model.up && this.model.up(result);
      }
    }
  }
  //if (direction !== null && direction !== this.last_direction) {
  if (direction !== null) {
    result['direction'] = direction;
    this.last_direction = direction;
      this.last_event_time = t;
    //this.game.input.activePointer.positionDown = this.game.input.activePointer.position;
    //console.log(this.game.input.activePointer.positionDown);
    return result;
  }
  return null;
}

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Swipe;
  }
}
