// GameMain: Core Loop, Survival Stats, Inventory, Crafting, Quests, Endings, and Bridge

class EchoesGameApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.world = null;
    this.entities = null;
    this.player = null;
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();

    // Survival Vitals
    this.health = 100;
    this.stamina = 100;
    this.hunger = 100;
    this.oxygen = 100;
    this.echoCooldown = 0;

    // Inventory & Crafting
    this.inventory = {
      wood: 0,
      metal: 0,
      food: 1,
      cell: 0,
      herb: 0,
      fiber: 0,
      relic: 0,
      crystal: 0,
      core: 0,
      matrix: 0,
      medkit: 1,
      flare: 1
    };

    // Quest Journal Progression
    this.quests = [
      {
        id: 'q1',
        title: 'Waking on the Shore',
        desc: 'Search the shipwreck for supplies (Scrap Metal and Emergency Rations).',
        completed: false
      },
      {
        id: 'q2',
        title: 'Voice in the Static',
        desc: 'Find a Power Cell and restore the Shoreline Radio Beacon.',
        completed: false
      },
      {
        id: 'q3',
        title: 'Echoes in the Pines',
        desc: 'Travel to Whispering Forest. Use Echo Vision (Q) to decipher the Ancient Monolith.',
        completed: false
      },
      {
        id: 'q4',
        title: 'Drowned Secrets',
        desc: 'Turn the Sluice Gate wheel in Sunken Village to drain the marsh and uncover the Beacon Crystal.',
        completed: false
      },
      {
        id: 'q5',
        title: 'Depths of Blackstone',
        desc: 'Delve into Blackstone Caverns and strike the crystals in harmonic resonance to claim the Core.',
        completed: false
      },
      {
        id: 'q6',
        title: 'Project Abyssal Core',
        desc: 'Input authorization code (1986) into the Research Facility terminal.',
        completed: false
      },
      {
        id: 'q7',
        title: 'The Final Threshold',
        desc: 'Deliver the 3 Keystones to the Abyssal Gate and decide the island fate.',
        completed: false
      }
    ];

    this.currentQuestIndex = 0;
    this.discoveredLoreNotes = [];
    this.activeInteractable = null;
    this.isPaused = false;
  }

  init() {
    const container = document.getElementById('canvas-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Setup Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('game-canvas'),
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Game Subsystems
    this.world = new IslandGameWorld(this.scene);
    this.world.init();

    this.entities = new EntityManager(this.scene, this.world);
    this.entities.init();

    this.player = new PlayerController(this.camera, this.world, this.scene);

    window.gameAudio.init();

    this.setupUIHandlers();
    this.setupWindowResize();

    // Start Main Loop
    requestAnimationFrame(this.loop.bind(this));
  }

  setupUIHandlers() {
    // Echo Vision Button
    const echoBtn = document.getElementById('btn-echo-vision');
    if (echoBtn) {
      echoBtn.addEventListener('click', () => this.triggerEchoVision());
    }
    window.onTriggerEcho = () => this.triggerEchoVision();

    // Sprint Button toggle on mobile
    const sprintBtn = document.getElementById('btn-sprint');
    if (sprintBtn) {
      sprintBtn.addEventListener('click', () => {
        this.player.isSprinting = !this.player.isSprinting;
        sprintBtn.classList.toggle('active', this.player.isSprinting);
      });
    }

    // Crouch Button toggle
    const crouchBtn = document.getElementById('btn-crouch');
    if (crouchBtn) {
      crouchBtn.addEventListener('click', () => {
        this.player.isCrouching = !this.player.isCrouching;
        crouchBtn.classList.toggle('active', this.player.isCrouching);
      });
    }

    // Jump Button
    const jumpBtn = document.getElementById('btn-jump');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        if (this.player.isGrounded && this.stamina > 10) {
          this.player.position.y += 0.8;
          this.stamina = Math.max(0, this.stamina - 12);
        }
      });
    }

    // Flashlight Button
    const flashBtn = document.getElementById('btn-flashlight');
    if (flashBtn) {
      flashBtn.addEventListener('click', () => {
        this.player.toggleFlashlight();
        flashBtn.classList.toggle('active', this.player.flashlightOn);
      });
    }

    // Interact Prompt / Click
    const prompt = document.getElementById('interact-prompt');
    if (prompt) {
      prompt.addEventListener('click', () => this.interact());
    }
    window.onTriggerInteract = () => this.interact();

    // Inventory Modal toggles
    window.toggleInventory = () => this.openModal('inventory-modal');
    window.toggleMap = () => {
      this.openModal('map-modal');
      this.drawIslandMap();
    };
    window.toggleJournal = () => this.openModal('journal-modal');

    // Region Discovery Callback
    window.onRegionDiscovered = reg => {
      this.showToast(`DISCOVERED: ${reg.name.toUpperCase()}`);
      window.gameAudio.playPuzzleSuccess();
      if (window.AndroidBridge && window.AndroidBridge.onLocationDiscovered) {
        window.AndroidBridge.onLocationDiscovered(reg.id, reg.name);
      }
    };

    // Damage callback from creatures
    window.onPlayerAttacked = dmg => {
      this.health = Math.max(0, this.health - dmg);
      window.gameAudio.playDamage();
      if (window.AndroidBridge && window.AndroidBridge.vibrate) {
        window.AndroidBridge.vibrate(200);
      }
      if (this.health <= 0) {
        this.handleGameOver();
      }
    };

    // Stealth alert UI
    window.onStealthAlertUpdate = alertVal => {
      const eye = document.getElementById('stealth-eye');
      const label = document.getElementById('stealth-label');
      if (eye && label) {
        if (alertVal > 0.15) {
          eye.classList.add('visible');
          if (alertVal > 0.6) {
            eye.classList.add('detected');
            label.textContent = 'HUNTED';
          } else {
            eye.classList.remove('detected');
            label.textContent = 'CAUTION';
          }
        } else {
          eye.classList.remove('visible');
        }
      }
    };
  }

  triggerEchoVision() {
    if (this.echoCooldown > 0) return;
    this.echoCooldown = 8.0; // 8s cooldown

    this.entities.triggerEchoPulse(this.player.position);
    window.gameAudio.playEchoPing();

    const fx = document.getElementById('screen-effects');
    if (fx) {
      fx.classList.add('echo-active');
      setTimeout(() => fx.classList.remove('echo-active'), 2500);
    }

    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(120);
    }

    // Quest Chapter 3 check
    if (this.currentQuestIndex === 2) {
      const reg = this.world.getCurrentRegion(this.player.position.x, this.player.position.z);
      if (reg.id === 'forest') {
        this.advanceQuest(2);
        this.showToast('MONOLITH GLYPHS DECODED: Constellation Alignment Discovered!');
      }
    }
  }

  interact() {
    if (!this.activeInteractable) return;

    if (this.activeInteractable.type === 'item') {
      const item = this.activeInteractable.data;
      this.inventory[item.type] = (this.inventory[item.type] || 0) + item.count;
      this.activeInteractable.mesh.userData.collected = true;
      this.activeInteractable.mesh.visible = false;

      window.gameAudio.playItemCollect();
      this.showToast(`Collected +${item.count} ${item.name}`);

      // Check quest completions
      if (this.currentQuestIndex === 0 && (item.type === 'metal' || item.type === 'food')) {
        this.advanceQuest(0);
      }
      if (item.type === 'crystal' && this.currentQuestIndex === 3) {
        this.advanceQuest(3);
      }
      if (item.type === 'core' && this.currentQuestIndex === 4) {
        this.advanceQuest(4);
      }
      if (item.type === 'matrix' && this.currentQuestIndex === 5) {
        this.advanceQuest(5);
      }

      this.activeInteractable = null;
      this.updatePrompt(null);
    } else if (this.activeInteractable.type === 'puzzle') {
      this.openPuzzleModal(this.activeInteractable.puzzleId);
    }
  }

  advanceQuest(completedIdx) {
    if (this.quests[completedIdx]) {
      this.quests[completedIdx].completed = true;
      if (this.currentQuestIndex <= completedIdx) {
        this.currentQuestIndex = Math.min(this.quests.length - 1, completedIdx + 1);
      }
      this.updateQuestUI();
      window.gameAudio.playPuzzleSuccess();
      this.showToast(`OBJECTIVE COMPLETED: ${this.quests[completedIdx].title}`);
      if (window.AndroidBridge && window.AndroidBridge.onQuestAdvanced) {
        window.AndroidBridge.onQuestAdvanced(completedIdx, this.quests[this.currentQuestIndex].title);
      }
    }
  }

  updateQuestUI() {
    const q = this.quests[this.currentQuestIndex];
    const bannerTitle = document.getElementById('quest-banner-title');
    const bannerDesc = document.getElementById('quest-banner-desc');
    if (bannerTitle && bannerDesc && q) {
      bannerTitle.textContent = `CHAPTER ${this.currentQuestIndex + 1}: ${q.title}`;
      bannerDesc.textContent = q.desc;
    }
  }

  openPuzzleModal(puzzleId) {
    const p = this.entities.puzzles[puzzleId];
    if (!p) return;

    if (puzzleId === 'beacon') {
      if (this.inventory.cell < 1) {
        this.showToast('REQUIRES: Power Cell to energize the beacon!');
        return;
      }
      p.solved = true;
      this.inventory.cell--;
      this.advanceQuest(1);
      this.showToast('RADIO BEACON RESTORED: Emergency Frequency Active!');
    } else if (puzzleId === 'sluice') {
      p.turns++;
      window.gameAudio.playClick();
      if (p.turns >= p.targetTurns) {
        p.solved = true;
        this.world.drainVillageWater();
        this.advanceQuest(3);
        this.showToast('SLUICE GATES OPENED: Water Drained in Sunken Village!');
      } else {
        this.showToast(`Turned Sluice Wheel (${p.turns}/${p.targetTurns})`);
      }
    } else if (puzzleId === 'crystals') {
      p.solved = true;
      this.advanceQuest(4);
      this.showToast('CRYSTAL RESONANCE HARMONIZED: Resonance Core Unsealed!');
    } else if (puzzleId === 'terminal') {
      p.solved = true;
      this.advanceQuest(5);
      this.showToast('SECURITY OVERRIDE ACCEPTED: Blast Doors Unlocked!');
    } else if (puzzleId === 'abyssal_gate') {
      this.triggerEndingChoice();
    }
  }

  triggerEndingChoice() {
    const modal = document.getElementById('ending-choice-modal');
    if (modal) {
      modal.classList.add('open');
    }
  }

  chooseEnding(endingType) {
    const modal = document.getElementById('ending-choice-modal');
    if (modal) modal.classList.remove('open');

    let title = '';
    let narrative = '';

    if (endingType === 'escape') {
      title = 'ENDING 1: THE RESCUE SIGNAL';
      narrative = 'You transmit your coordinates across the ocean expanse. As morning breaks, the roar of twin sea plane propellers cuts through the morning fog. You escape the island, but the enigmatic secrets of the abyss remain forever buried beneath the waves.';
    } else if (endingType === 'awakening') {
      title = 'ENDING 2: THE ABYSSAL AWAKENING';
      narrative = 'Stepping through the roaring energy vortex of the Abyssal Gate, the boundary of human reality dissolves. You witness the ancient architects of the cosmos and transcend mortal understanding into the infinite depths.';
    } else {
      title = 'ENDING 3: THE ISLAND GUARDIAN';
      narrative = 'Understanding the apocalyptic catastrophe that Project Abyss nearly brought upon humanity, you trigger the terminal lockdown. The island is permanently shrouded in impenetrable oceanic mist, guarded by you for eternity.';
    }

    if (window.AndroidBridge && window.AndroidBridge.onEndingReached) {
      window.AndroidBridge.onEndingReached(endingType, title, narrative);
    } else {
      alert(`${title}\n\n${narrative}`);
      window.location.reload();
    }
  }

  handleGameOver() {
    this.showToast('YOU HAVE SUCCUMBED TO THE ABYSS...');
    setTimeout(() => {
      this.health = 100;
      this.player.position.set(-35, 3, 52);
      this.showToast('AWAKENED BACK AT THE SHORE...');
    }, 2500);
  }

  loop() {
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isPaused) {
      // 1. Update Survival Vitals
      // Stamina
      const moveState = this.player.update(delta, this.stamina, this.hunger);
      if (moveState.isSprinting) {
        this.stamina = Math.max(0, this.stamina - delta * 18);
      } else {
        this.stamina = Math.min(100, this.stamina + delta * 14);
      }

      // Hunger slowly drains
      this.hunger = Math.max(0, this.hunger - delta * 0.4);

      // Swimming drains oxygen
      if (moveState.isSwimming) {
        this.oxygen = Math.max(0, this.oxygen - delta * 12);
        if (this.oxygen <= 0) {
          this.health = Math.max(0, this.health - delta * 15);
        }
      } else {
        this.oxygen = Math.min(100, this.oxygen + delta * 25);
      }

      // Echo cooldown
      if (this.echoCooldown > 0) {
        this.echoCooldown = Math.max(0, this.echoCooldown - delta);
      }

      // 2. Update World & Weather
      this.world.update(delta, this.player.position);

      // 3. Update Entities & AI
      const noise = this.player.getNoiseLevel();
      this.entities.update(delta, this.player.position, noise, this.player.flashlightOn);

      // 4. Raycast for Interacting
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      const interactable = this.entities.getInteractableAt(this.raycaster);

      // Check proximity to landmarks
      let landmarkInteract = null;
      const px = this.player.position.x;
      const pz = this.player.position.z;

      if (Math.hypot(px - (-28), pz - 48) < 3.5) {
        landmarkInteract = { type: 'puzzle', puzzleId: 'beacon', prompt: 'E - Restore Radio Beacon' };
      } else if (Math.hypot(px - 30, pz - 26) < 3.8) {
        landmarkInteract = { type: 'puzzle', puzzleId: 'sluice', prompt: 'E - Turn Sluice Drainage Wheel' };
      } else if (Math.hypot(px - (-45), pz - (-50)) < 4.2) {
        landmarkInteract = { type: 'puzzle', puzzleId: 'crystals', prompt: 'E - Harmonic Resonance Chimes' };
      } else if (Math.hypot(px - 35, pz - (-55)) < 4.0) {
        landmarkInteract = { type: 'puzzle', puzzleId: 'terminal', prompt: 'E - Access Facility Terminal' };
      } else if (Math.hypot(px - 60, pz - (-15)) < 4.5) {
        landmarkInteract = { type: 'puzzle', puzzleId: 'abyssal_gate', prompt: 'E - Activate Abyssal Gate' };
      }

      const active = interactable || landmarkInteract;
      this.activeInteractable = active;
      this.updatePrompt(active);

      // 5. Update HUD elements
      this.updateHUD();

      // 6. Render 3D Frame
      this.renderer.render(this.scene, this.camera);
    }

    requestAnimationFrame(this.loop.bind(this));
  }

  updateHUD() {
    // Vitals
    const hFill = document.getElementById('vital-health');
    const sFill = document.getElementById('vital-stamina');
    const uFill = document.getElementById('vital-hunger');
    const oFill = document.getElementById('vital-oxygen');
    const oRow = document.getElementById('vital-row-oxygen');

    if (hFill) hFill.style.width = `${Math.round(this.health)}%`;
    if (sFill) sFill.style.width = `${Math.round(this.stamina)}%`;
    if (uFill) uFill.style.width = `${Math.round(this.hunger)}%`;

    if (oRow && oFill) {
      if (this.player.isSwimming) {
        oRow.style.display = 'flex';
        oFill.style.width = `${Math.round(this.oxygen)}%`;
      } else {
        oRow.style.display = 'none';
      }
    }

    // Health Vignette danger pulse
    const fx = document.getElementById('screen-effects');
    if (fx) {
      if (this.health < 30) fx.classList.add('low-health');
      else fx.classList.remove('low-health');
    }

    // Compass
    const compText = document.getElementById('compass-heading');
    if (compText) {
      const deg = Math.round(((this.player.yaw * 180 / Math.PI) % 360 + 360) % 360);
      let cardinal = 'N';
      if (deg >= 45 && deg < 135) cardinal = 'E';
      else if (deg >= 135 && deg < 225) cardinal = 'S';
      else if (deg >= 225 && deg < 315) cardinal = 'W';
      compText.textContent = `${cardinal} ${deg}°`;
    }

    // Current Region badge
    const curRegion = this.world.getCurrentRegion(this.player.position.x, this.player.position.z);
    const regLabel = document.getElementById('hud-region-name');
    if (regLabel && curRegion) {
      regLabel.textContent = curRegion.name;
    }

    // Echo Button Cooldown
    const echoBtn = document.getElementById('btn-echo-vision');
    if (echoBtn) {
      echoBtn.classList.toggle('cooldown', this.echoCooldown > 0);
    }
  }

  updatePrompt(active) {
    const prompt = document.getElementById('interact-prompt');
    const cross = document.getElementById('crosshair');
    if (active) {
      prompt.textContent = active.prompt;
      prompt.classList.add('show');
      cross.classList.add('interactable');
    } else {
      prompt.classList.remove('show');
      cross.classList.remove('interactable');
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }

  openModal(modalId) {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('open'));
    const target = document.getElementById(modalId);
    if (target) {
      target.classList.add('open');
      this.populateModalContent(modalId);
    }
  }

  closeModals() {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('open'));
  }

  populateModalContent(modalId) {
    if (modalId === 'inventory-modal') {
      const grid = document.getElementById('inv-grid-container');
      if (!grid) return;
      grid.innerHTML = '';
      const items = [
        { type: 'wood', name: 'Driftwood', icon: '🪵', count: this.inventory.wood, desc: 'Weathered timber from wrecked ship.' },
        { type: 'metal', name: 'Scrap Metal', icon: '🔩', count: this.inventory.metal, desc: 'Corroded brass & alloy components.' },
        { type: 'food', name: 'Emergency Rations', icon: '🍞', count: this.inventory.food, desc: 'Nutrient paste, restores 35 hunger.' },
        { type: 'cell', name: 'Power Cell', icon: '🔋', count: this.inventory.cell, desc: 'High-energy isotope battery.' },
        { type: 'herb', name: 'Medicinal Herbs', icon: '🌿', count: this.inventory.herb, desc: 'Restores 40 health when brewed.' },
        { type: 'fiber', name: 'Plant Fiber', icon: '🧶', count: this.inventory.fiber, desc: 'Twisted jungle vine cordage.' },
        { type: 'relic', name: 'Ancient Relic', icon: '🔮', count: this.inventory.relic, desc: 'Pulsing with mysterious sonar resonance.' },
        { type: 'crystal', name: 'Beacon Crystal', icon: '💎', count: this.inventory.crystal, desc: 'First Keystone from Sunken Village.' },
        { type: 'core', name: 'Resonance Core', icon: '🔮', count: this.inventory.core, desc: 'Second Keystone from Blackstone Caverns.' },
        { type: 'matrix', name: 'Override Matrix', icon: '💾', count: this.inventory.matrix, desc: 'Third Keystone from Research Facility.' },
        { type: 'medkit', name: 'First Aid Kit', icon: '🩹', count: this.inventory.medkit, desc: 'Restores 50 health.' },
        { type: 'flare', name: 'Signal Flare', icon: '🔥', count: this.inventory.flare, desc: 'Stuns predators in area.' }
      ];

      items.forEach(it => {
        if (it.count > 0) {
          const card = document.createElement('div');
          card.className = 'inv-card';
          card.innerHTML = `
            <div class="inv-icon">${it.icon}</div>
            <div class="inv-name">${it.name}</div>
            <div class="inv-count">x${it.count}</div>
            <div class="inv-desc">${it.desc}</div>
          `;
          card.onclick = () => {
            if (it.type === 'food') {
              this.inventory.food--;
              this.hunger = Math.min(100, this.hunger + 35);
              window.gameAudio.playItemCollect();
              this.populateModalContent('inventory-modal');
              this.showToast('Consumed Rations (+35 Hunger)');
            } else if (it.type === 'medkit' || it.type === 'herb') {
              this.inventory[it.type]--;
              this.health = Math.min(100, this.health + (it.type === 'medkit' ? 50 : 35));
              window.gameAudio.playItemCollect();
              this.populateModalContent('inventory-modal');
              this.showToast('Applied Medicine (+Health)');
            }
          };
          grid.appendChild(card);
        }
      });
    }
  }

  drawIslandMap() {
    const canvas = document.getElementById('island-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Island shape
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw 6 Regions
    this.world.regions.forEach(reg => {
      const rx = w / 2 + (reg.x / 100) * (w * 0.4);
      const rz = h / 2 + (reg.z / 100) * (h * 0.4);

      ctx.fillStyle = reg.discovered ? 'rgba(0, 240, 255, 0.2)' : 'rgba(100, 116, 139, 0.2)';
      ctx.beginPath();
      ctx.arc(rx, rz, (reg.radius / 100) * (w * 0.35), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = reg.discovered ? '#38bdf8' : '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(reg.name, rx, rz);
    });

    // Player position marker
    const px = w / 2 + (this.player.position.x / 100) * (w * 0.4);
    const pz = h / 2 + (this.player.position.z / 100) * (h * 0.4);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(px, pz, 6, 0, Math.PI * 2);
    ctx.fill();

    // Heading arrow
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(px - Math.sin(this.player.yaw) * 14, pz - Math.cos(this.player.yaw) * 14);
    ctx.stroke();
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new EchoesGameApp();
  window.gameApp.init();
});
