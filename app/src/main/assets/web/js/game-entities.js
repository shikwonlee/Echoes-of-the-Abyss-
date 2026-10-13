// GameEntities: Collectibles, Abyssal Prowler AI, and Environmental Puzzles

class EntityManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.items = [];
    this.creatures = [];
    this.puzzles = {};
    this.echoActive = false;
    this.echoRadius = 0;
    this.echoOrigin = new THREE.Vector3();
  }

  init() {
    this.spawnLootItems();
    this.spawnCreatures();
    this.setupPuzzles();
  }

  spawnLootItems() {
    const itemDefs = [
      // Forgotten Shore loot
      { id: 'driftwood', name: 'Driftwood', type: 'wood', x: -38, z: 52, icon: '🪵', count: 3 },
      { id: 'scrap_metal_1', name: 'Scrap Metal', type: 'metal', x: -44, z: 62, icon: '🔩', count: 2 },
      { id: 'rations_1', name: 'Emergency Rations', type: 'food', x: -32, z: 46, icon: '🍞', count: 2 },
      { id: 'power_cell_1', name: 'Power Cell', type: 'cell', x: -24, z: 42, icon: '🔋', count: 1 },
      // Whispering Forest loot
      { id: 'herbs_1', name: 'Medicinal Herbs', type: 'herb', x: -18, z: 12, icon: '🌿', count: 2 },
      { id: 'fiber_1', name: 'Plant Fiber', type: 'fiber', x: -10, z: -4, icon: '🧶', count: 3 },
      { id: 'ancient_relic_1', name: 'Ancient Relic', type: 'relic', x: -16, z: 7, icon: '🔮', count: 1 },
      // Sunken Village loot
      { id: 'scrap_metal_2', name: 'Brass Scrap', type: 'metal', x: 40, z: 38, icon: '🔩', count: 2 },
      { id: 'beacon_crystal', name: 'Beacon Crystal', type: 'crystal', x: 48, z: 46, icon: '💎', count: 1 },
      // Blackstone Caverns loot
      { id: 'resonance_core', name: 'Resonance Core', type: 'core', x: -48, z: -52, icon: '🔮', count: 1 },
      { id: 'herbs_2', name: 'Cave Lichen Herb', type: 'herb', x: -38, z: -45, icon: '🌿', count: 2 },
      // Research Facility loot
      { id: 'facility_matrix', name: 'Override Matrix', type: 'matrix', x: 36, z: -58, icon: '💾', count: 1 },
      { id: 'power_cell_2', name: 'High-Cap Cell', type: 'cell', x: 32, z: -50, icon: '🔋', count: 1 }
    ];

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, metalness: 0.6 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.8 });

    itemDefs.forEach(def => {
      const y = this.world.getTerrainHeight(def.x, def.z) + 0.4;
      const mesh = new THREE.Mesh(
        def.type === 'crystal' || def.type === 'relic' || def.type === 'core'
          ? new THREE.OctahedronGeometry(0.4, 0)
          : new THREE.BoxGeometry(0.7, 0.5, 0.7),
        def.type === 'crystal' || def.type === 'relic' ? boxMat.clone() : crateMat.clone()
      );
      mesh.position.set(def.x, y, def.z);
      mesh.castShadow = true;
      mesh.userData = { ...def, isItem: true, collected: false };

      // Halo ring that glows under Echo Vision
      const haloGeo = new THREE.RingGeometry(0.6, 0.8, 16);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = -0.35;
      mesh.add(halo);
      mesh.userData.halo = halo;

      this.scene.add(mesh);
      this.items.push(mesh);
    });
  }

  spawnCreatures() {
    // Spawn 2 Abyssal Prowlers (Forest & Caverns)
    const prowlerConfigs = [
      { id: 'prowler_forest', startX: -12, startZ: 18, patrolRadius: 18, speed: 3.2 },
      { id: 'prowler_caverns', startX: -42, startZ: -46, patrolRadius: 14, speed: 3.5 }
    ];

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.3 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    prowlerConfigs.forEach(cfg => {
      const group = new THREE.Group();
      const startY = this.world.getTerrainHeight(cfg.startX, cfg.startZ) + 0.8;
      group.position.set(cfg.startX, startY, cfg.startZ);

      // Biomechanical insectoid / feline quadruped predator body
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.4), bodyMat);
      torso.position.y = 0.8;
      torso.castShadow = true;
      group.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), bodyMat);
      head.position.set(0, 1.2, 1.4);
      head.rotation.x = Math.PI / 2;
      group.add(head);

      // Glowing twin predatory eyes
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
      eyeL.position.set(0.3, 1.3, 1.8);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
      eyeR.position.set(-0.3, 1.3, 1.8);
      group.add(eyeL);
      group.add(eyeR);

      // Eye PointLight
      const eyeLight = new THREE.PointLight(0xef4444, 0.6, 8);
      eyeLight.position.set(0, 1.3, 1.8);
      group.add(eyeLight);

      // 4 Jointed Legs
      const legs = [];
      for (let l = 0; l < 4; l++) {
        const lx = (l % 2 === 0 ? 0.9 : -0.9);
        const lz = (l < 2 ? 0.8 : -0.8);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.2, 4), bodyMat);
        leg.position.set(lx, 0.3, lz);
        group.add(leg);
        legs.push(leg);
      }

      this.scene.add(group);
      this.creatures.push({
        group,
        cfg,
        legs,
        state: 'patrol', // 'patrol', 'alert', 'chase', 'stunned'
        alertLevel: 0.0,
        stunTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        targetPos: new THREE.Vector3(cfg.startX, startY, cfg.startZ)
      });
    });
  }

  setupPuzzles() {
    this.puzzles = {
      beacon: {
        id: 'beacon',
        title: 'Radio Beacon Restorer',
        desc: 'Insert a Power Cell and match the transmitter frequency to 742 MHz.',
        solved: false,
        requiresItem: 'Power Cell',
        targetFreq: 742,
        currentFreq: 500
      },
      monolith: {
        id: 'monolith',
        title: 'Ancient Monolith Alignment',
        desc: 'Align the 3 celestial rings to match the constellation glyphs.',
        solved: false,
        rings: [0, 1, 2], // degrees: 0, 90, 180
        targetRings: [1, 2, 0]
      },
      sluice: {
        id: 'sluice',
        title: 'Sluice Gate Drainage',
        desc: 'Turn the rusted drainage wheel to lower water and reveal the sunken archive.',
        solved: false,
        turns: 0,
        targetTurns: 3
      },
      crystals: {
        id: 'crystals',
        title: 'Blackstone Resonance Chimes',
        desc: 'Strike the harmonic crystals in resonance order (revealed by Echo pulses: 1 -> 3 -> 2 -> 4).',
        solved: false,
        sequence: [1, 3, 2, 4],
        input: []
      },
      terminal: {
        id: 'terminal',
        title: 'Research Facility Override',
        desc: 'Enter Project Abyss catastrophe authorization code (Archived Year: 1986).',
        solved: false,
        correctCode: '1986',
        input: ''
      },
      abyssal_gate: {
        id: 'abyssal_gate',
        title: 'The Abyssal Threshold',
        desc: 'Insert the 3 Keystones into the pedestals to unlock the portal of escape.',
        solved: false,
        keystonesInserted: [false, false, false]
      }
    };
  }

  triggerEchoPulse(origin) {
    this.echoActive = true;
    this.echoRadius = 0;
    this.echoOrigin.copy(origin);
  }

  update(delta, playerPos, playerNoise, playerLight) {
    // 1. Update Echo Vision wave expansion
    if (this.echoActive) {
      this.echoRadius += delta * 35; // expands up to 45 meters
      if (this.echoRadius > 45) {
        this.echoActive = false;
      }
    }

    // 2. Update Loot Items (Bobbing + Echo Highlight)
    const time = performance.now() * 0.002;
    this.items.forEach(mesh => {
      if (mesh.userData.collected) return;
      mesh.rotation.y += delta * 0.8;

      const d = mesh.position.distanceTo(playerPos);
      const inEcho = this.echoActive && Math.abs(mesh.position.distanceTo(this.echoOrigin) - this.echoRadius) < 8;

      if (mesh.userData.halo) {
        if (inEcho || d < 6) {
          mesh.userData.halo.material.opacity = THREE.MathUtils.lerp(mesh.userData.halo.material.opacity, 0.9, 0.1);
        } else {
          mesh.userData.halo.material.opacity = THREE.MathUtils.lerp(mesh.userData.halo.material.opacity, 0.0, 0.05);
        }
      }
    });

    // 3. Update Creatures (AI State Machine & Sound Detection)
    let maxCreatureAlert = 0.0;
    this.creatures.forEach(cr => {
      const distToPlayer = cr.group.position.distanceTo(playerPos);

      // Echo pulse stuns nearby creatures
      if (this.echoActive && Math.abs(distToPlayer - this.echoRadius) < 4) {
        cr.state = 'stunned';
        cr.stunTimer = 6.0;
        window.gameAudio.playCreatureAlert();
      }

      if (cr.state === 'stunned') {
        cr.stunTimer -= delta;
        cr.group.rotation.z = Math.sin(time * 10) * 0.2; // shuddering
        if (cr.stunTimer <= 0) {
          cr.state = 'patrol';
          cr.group.rotation.z = 0;
        }
        return;
      }

      // Detection logic: Hearing (playerNoise radius) + Vision + Light
      const hearingThreshold = playerNoise; // walking: 8m, sprinting: 22m, crouch: 2m
      const visionThreshold = playerLight ? 22 : 12;

      let detected = false;
      if (distToPlayer < hearingThreshold) {
        detected = true;
      }
      if (distToPlayer < visionThreshold) {
        // Forward angle check
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(cr.group.quaternion);
        const toPlayer = playerPos.clone().sub(cr.group.position).normalize();
        if (forward.dot(toPlayer) > 0.3) {
          detected = true;
        }
      }

      if (detected) {
        cr.alertLevel = Math.min(1.0, cr.alertLevel + delta * 1.5);
      } else {
        cr.alertLevel = Math.max(0.0, cr.alertLevel - delta * 0.5);
      }

      maxCreatureAlert = Math.max(maxCreatureAlert, cr.alertLevel);

      if (cr.alertLevel >= 0.8) {
        cr.state = 'chase';
      } else if (cr.alertLevel > 0.2) {
        cr.state = 'alert';
      } else {
        cr.state = 'patrol';
      }

      // State Actions
      if (cr.state === 'chase') {
        // Sprint towards player
        cr.group.lookAt(playerPos.x, cr.group.position.y, playerPos.z);
        const dir = playerPos.clone().sub(cr.group.position).normalize();
        cr.group.position.x += dir.x * cr.cfg.speed * 1.4 * delta;
        cr.group.position.z += dir.z * cr.cfg.speed * 1.4 * delta;

        // Damage player if in melee reach
        if (distToPlayer < 2.2 && window.onPlayerAttacked) {
          window.onPlayerAttacked(delta * 25);
        }
      } else if (cr.state === 'alert') {
        // Stop and look around
        cr.group.lookAt(playerPos.x, cr.group.position.y, playerPos.z);
      } else {
        // Patrol in smooth circle around base
        cr.patrolAngle += delta * 0.4;
        const targetX = cr.cfg.startX + Math.cos(cr.patrolAngle) * cr.cfg.patrolRadius;
        const targetZ = cr.cfg.startZ + Math.sin(cr.patrolAngle) * cr.cfg.patrolRadius;
        cr.group.lookAt(targetX, cr.group.position.y, targetZ);
        cr.group.position.x += Math.cos(cr.patrolAngle) * cr.cfg.speed * delta;
        cr.group.position.z += Math.sin(cr.patrolAngle) * cr.cfg.speed * delta;
      }

      // Update creature Y to match terrain
      cr.group.position.y = this.world.getTerrainHeight(cr.group.position.x, cr.group.position.z) + 0.8;

      // Animate walking legs
      cr.legs.forEach((leg, i) => {
        leg.rotation.x = Math.sin(time * 6 + i) * 0.5;
      });
    });

    if (window.onStealthAlertUpdate) {
      window.onStealthAlertUpdate(maxCreatureAlert);
    }
  }

  getInteractableAt(raycaster) {
    const activeMeshes = this.items.filter(i => !i.userData.collected);
    const intersects = raycaster.intersectObjects(activeMeshes, true);
    if (intersects.length > 0 && intersects[0].distance < 3.8) {
      let root = intersects[0].object;
      while (root.parent && !root.userData.isItem) {
        root = root.parent;
      }
      if (root.userData && root.userData.isItem) {
        return {
          type: 'item',
          data: root.userData,
          mesh: root,
          prompt: `E - Pick up ${root.userData.name}`
        };
      }
    }
    return null;
  }
}

window.EntityManager = EntityManager;
