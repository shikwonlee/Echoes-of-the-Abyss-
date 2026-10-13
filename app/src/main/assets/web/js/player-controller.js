// PlayerController: First-Person Physics, Dual Touch Joystick, Keyboard & Camera

class PlayerController {
  constructor(camera, world, scene) {
    this.camera = camera;
    this.world = world;
    this.scene = scene;

    this.position = new THREE.Vector3(-35, 3, 52); // Starts on Forgotten Shore
    this.velocity = new THREE.Vector3();
    this.yaw = 0.4;
    this.pitch = 0.0;
    this.isGrounded = true;
    this.isSwimming = false;
    this.isSprinting = false;
    this.isCrouching = false;
    this.flashlightOn = false;

    // Movement speeds
    this.walkSpeed = 4.5;
    this.sprintSpeed = 8.0;
    this.crouchSpeed = 2.4;
    this.swimSpeed = 3.6;

    // Step cadence & surface
    this.stepDistance = 0;
    this.headBobTime = 0;

    // Flashlight
    this.flashlight = new THREE.SpotLight(0xfff7ed, 0.0, 35, Math.PI / 4, 0.4, 1.2);
    this.flashlight.position.set(0, 0, 0);
    this.camera.add(this.flashlight);
    this.scene.add(this.camera);

    // Keyboard states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      crouch: false
    };

    // Virtual Joystick state
    this.joystick = { x: 0, y: 0 };
    this.touchLookSensitivity = 0.0035;

    this.setupKeyboardListeners();
    this.setupTouchControls();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', e => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'Space': this.keys.jump = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = true; break;
        case 'ControlLeft': case 'ControlRight': case 'KeyC': this.isCrouching = !this.isCrouching; break;
        case 'KeyF': this.toggleFlashlight(); break;
        case 'KeyE': if (window.onTriggerInteract) window.onTriggerInteract(); break;
        case 'KeyQ': if (window.onTriggerEcho) window.onTriggerEcho(); break;
        case 'Tab': e.preventDefault(); if (window.toggleInventory) window.toggleInventory(); break;
        case 'KeyM': if (window.toggleMap) window.toggleMap(); break;
      }
    });

    window.addEventListener('keyup', e => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'Space': this.keys.jump = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
      }
    });
  }

  setupTouchControls() {
    // Touch look on right side of screen
    let lastTouchX = 0;
    let lastTouchY = 0;
    let lookTouchId = null;

    const layer = document.getElementById('touch-controls-layer');
    if (!layer) return;

    // Joystick elements
    const joyZone = document.getElementById('joystick-zone');
    const joyThumb = document.getElementById('joystick-thumb');
    let joyTouchId = null;
    let joyOriginX = 0;
    let joyOriginY = 0;

    layer.addEventListener('touchstart', e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // Left half = joystick
        if (touch.clientX < window.innerWidth * 0.45 && joyTouchId === null) {
          joyTouchId = touch.identifier;
          const rect = joyZone.getBoundingClientRect();
          joyOriginX = rect.left + rect.width / 2;
          joyOriginY = rect.top + rect.height / 2;
          this.handleJoyTouch(touch.clientX, touch.clientY, joyOriginX, joyOriginY, joyThumb);
        } else if (touch.clientX >= window.innerWidth * 0.45 && lookTouchId === null) {
          // Right half = camera look
          lookTouchId = touch.identifier;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
        }
      }
    }, { passive: false });

    layer.addEventListener('touchmove', e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joyTouchId) {
          this.handleJoyTouch(touch.clientX, touch.clientY, joyOriginX, joyOriginY, joyThumb);
        } else if (touch.identifier === lookTouchId) {
          const dx = touch.clientX - lastTouchX;
          const dy = touch.clientY - lastTouchY;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;

          this.yaw -= dx * this.touchLookSensitivity;
          this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch - dy * this.touchLookSensitivity));
        }
      }
    }, { passive: false });

    const endTouch = e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joyTouchId) {
          joyTouchId = null;
          this.joystick.x = 0;
          this.joystick.y = 0;
          joyThumb.style.transform = `translate(0px, 0px)`;
        } else if (touch.identifier === lookTouchId) {
          lookTouchId = null;
        }
      }
    };

    layer.addEventListener('touchend', endTouch);
    layer.addEventListener('touchcancel', endTouch);
  }

  handleJoyTouch(tx, ty, ox, oy, thumb) {
    const maxRadius = 50;
    let dx = tx - ox;
    let dy = ty - oy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    this.joystick.x = dx / maxRadius;
    this.joystick.y = dy / maxRadius;
  }

  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 2.2 : 0.0;
    window.gameAudio.playClick();
  }

  getNoiseLevel() {
    if (this.isCrouching) return 2.0;
    if (this.isSprinting && (this.keys.forward || Math.abs(this.joystick.y) > 0.3)) return 22.0;
    if (this.keys.forward || this.keys.backward || Math.hypot(this.joystick.x, this.joystick.y) > 0.1) return 8.0;
    return 0.5;
  }

  update(delta, stamina, hunger) {
    // Determine movement direction relative to camera yaw
    let moveForward = 0;
    let moveSide = 0;

    if (this.keys.forward) moveForward += 1;
    if (this.keys.backward) moveForward -= 1;
    if (this.keys.left) moveSide -= 1;
    if (this.keys.right) moveSide += 1;

    // Add joystick input
    moveForward -= this.joystick.y;
    moveSide += this.joystick.x;

    // Normalize input
    const inputMag = Math.hypot(moveForward, moveSide);
    if (inputMag > 1) {
      moveForward /= inputMag;
      moveSide /= inputMag;
    }

    // Determine speed
    let currentSpeed = this.walkSpeed;
    const canSprint = this.isSprinting && stamina > 5 && !this.isCrouching && !this.isSwimming;
    if (canSprint && inputMag > 0.1) {
      currentSpeed = this.sprintSpeed;
    } else if (this.isCrouching) {
      currentSpeed = this.crouchSpeed;
    } else if (this.isSwimming) {
      currentSpeed = this.swimSpeed;
    }

    // World directional movement vectors
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const worldDx = (-sinYaw * moveForward + cosYaw * moveSide) * currentSpeed;
    const worldDz = (-cosYaw * moveForward - sinYaw * moveSide) * currentSpeed;

    // Potential new position
    const nextX = this.position.x + worldDx * delta;
    const nextZ = this.position.z + worldDz * delta;

    // Obstacle collision check with sliding
    let collided = false;
    for (const c of this.world.colliders) {
      const dist = Math.hypot(nextX - c.x, nextZ - c.z);
      if (dist < c.radius + 0.6) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    // Clamping to island boundaries
    this.position.x = Math.max(-95, Math.min(95, this.position.x));
    this.position.z = Math.max(-95, Math.min(95, this.position.z));

    // Terrain elevation & water check
    const terrainY = this.world.getTerrainHeight(this.position.x, this.position.z);
    const playerHeight = this.isCrouching ? 1.1 : 1.75;

    if (terrainY < this.world.waterLevel - 0.5) {
      // Swimming mode
      this.isSwimming = true;
      const targetY = this.world.waterLevel + 0.3 + Math.sin(performance.now() * 0.003) * 0.1;
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, 0.1);
      this.isGrounded = false;
    } else {
      // Grounded walking mode
      this.isSwimming = false;
      const targetY = terrainY + playerHeight;
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, 0.2);
      this.isGrounded = true;

      // Jumping
      if (this.keys.jump && this.isGrounded && stamina > 10) {
        this.position.y += 0.8;
      }
    }

    // Footstep audio & head bob
    if (inputMag > 0.1) {
      this.stepDistance += currentSpeed * delta;
      this.headBobTime += delta * (currentSpeed * 1.5);

      if (this.stepDistance > (this.isSprinting ? 2.8 : 1.8)) {
        this.stepDistance = 0;
        let surface = 'grass';
        if (this.isSwimming) surface = 'water';
        else if (terrainY <= 1.8) surface = 'sand';
        else if (terrainY > 10) surface = 'stone';
        window.gameAudio.playFootstep(surface);
      }
    }

    // Apply Head Bobbing
    const bobOffset = inputMag > 0.1 ? Math.sin(this.headBobTime) * 0.05 : 0;

    // Update Camera
    this.camera.position.set(this.position.x, this.position.y + bobOffset, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    return {
      isMoving: inputMag > 0.1,
      isSprinting: canSprint && inputMag > 0.1,
      isSwimming: this.isSwimming,
      isCrouching: this.isCrouching
    };
  }
}

window.PlayerController = PlayerController;
