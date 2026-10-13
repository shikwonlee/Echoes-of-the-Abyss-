// GameWorld: 3D Scene, Procedural Terrain, Water, Weather, and the 6 Island Regions

class IslandGameWorld {
  constructor(scene) {
    this.scene = scene;
    this.terrainMesh = null;
    this.waterMesh = null;
    this.rainParticles = null;
    this.sunLight = null;
    this.moonLight = null;
    this.hemiLight = null;
    this.stars = null;
    this.timeOfDay = 0.35; // 0.0 to 1.0 (0.25=sunrise, 0.5=noon, 0.75=sunset, 0.0/1.0=midnight)
    this.weather = 'clear'; // 'clear', 'fog', 'storm'
    this.rainCount = 1800;
    this.stormFlashTimer = 0;
    this.regions = [
      { id: 'shore', name: 'The Forgotten Shore', x: -35, z: 50, radius: 45, discovered: true },
      { id: 'forest', name: 'The Whispering Forest', x: -15, z: 5, radius: 40, discovered: false },
      { id: 'village', name: 'The Sunken Village', x: 45, z: 45, radius: 40, discovered: false },
      { id: 'caverns', name: 'The Blackstone Caverns', x: -45, z: -50, radius: 35, discovered: false },
      { id: 'facility', name: 'The Research Facility', x: 35, z: -55, radius: 40, discovered: false },
      { id: 'gate', name: 'The Abyssal Gate', x: 60, z: -15, radius: 35, discovered: false }
    ];
    this.colliders = [];
    this.abyssalPortalMesh = null;
    this.portalVortex = null;
    this.waterLevel = 1.0;
  }

  init() {
    this.setupLighting();
    this.buildSkyAndStars();
    this.buildTerrain();
    this.buildOcean();
    this.buildWeatherParticles();
    this.buildRegions();
  }

  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1e293b, 0.6);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3d6, 1.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 250;
    const d = 80;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);
  }

  buildSkyAndStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 240;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = Math.abs(r * Math.cos(phi)) + 10;
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 1.5,
      transparent: true,
      opacity: 0.85
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);
  }

  buildTerrain() {
    // 200x200 island terrain mesh
    const width = 220;
    const height = 220;
    const segments = 100;
    const geo = new THREE.PlaneGeometry(width, height, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Distance from center determines island dropoff
      const distFromCenter = Math.sqrt(x * x + z * z);
      const islandFalloff = Math.max(0, 1 - Math.pow(distFromCenter / 100, 2.2));

      // Layered noise simulation
      const n1 = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 6;
      const n2 = Math.sin(x * 0.09 + 1.2) * Math.cos(z * 0.08 - 0.7) * 3;
      const n3 = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 1.2;

      // Special height features for regions:
      // Cliffs towards the North (Facility & Abyssal Gate)
      let featureHeight = 0;
      if (z < -20) {
        featureHeight += Math.max(0, -z - 20) * 0.35;
      }
      // Caverns depression
      if (x < -20 && z < -20) {
        featureHeight -= 4;
      }
      // Sunken village marsh depression
      if (x > 20 && z > 20) {
        featureHeight -= 3;
      }

      let y = (n1 + n2 + n3 + 5 + featureHeight) * islandFalloff - 2;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    // Custom vertex colored material for sand, grass, and dark rock
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const sandCol = new THREE.Color(0xd4af37);
    const grassCol = new THREE.Color(0x2d4a22);
    const rockCol = new THREE.Color(0x334155);

    for (let i = 0; i < count; i++) {
      const y = pos.getY(i);
      const normalY = geo.attributes.normal.getY(i);
      let c = grassCol.clone();
      if (y <= 1.8) {
        c = sandCol.clone().lerp(grassCol, Math.max(0, (y - 0.5) / 1.3));
      } else if (normalY < 0.75 || y > 14) {
        c = rockCol.clone();
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1
    });

    this.terrainMesh = new THREE.Mesh(geo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  // Get terrain height at (x, z) for accurate collision and foot placement
  getTerrainHeight(x, z) {
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 110) return -5;
    const islandFalloff = Math.max(0, 1 - Math.pow(distFromCenter / 100, 2.2));
    const n1 = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 6;
    const n2 = Math.sin(x * 0.09 + 1.2) * Math.cos(z * 0.08 - 0.7) * 3;
    const n3 = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 1.2;

    let featureHeight = 0;
    if (z < -20) featureHeight += Math.max(0, -z - 20) * 0.35;
    if (x < -20 && z < -20) featureHeight -= 4;
    if (x > 20 && z > 20) featureHeight -= 3;

    return (n1 + n2 + n3 + 5 + featureHeight) * islandFalloff - 2;
  }

  buildOcean() {
    const waterGeo = new THREE.PlaneGeometry(350, 350, 60, 60);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = this.waterLevel;
    this.scene.add(this.waterMesh);
  }

  buildWeatherParticles() {
    const rainGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 140;
      pos[i + 1] = Math.random() * 40;
      pos[i + 2] = (Math.random() - 0.5) * 140;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.8,
      transparent: true,
      opacity: 0.0 // hidden by default unless storm
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  buildRegions() {
    this.buildShoreRegion();
    this.buildForestRegion();
    this.buildVillageRegion();
    this.buildCavernRegion();
    this.buildFacilityRegion();
    this.buildAbyssalGateRegion();
  }

  // Region 1: The Forgotten Shore
  buildShoreRegion() {
    // Shipwreck hull & mast
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x452818, roughness: 0.9 });
    const hullGroup = new THREE.Group();
    hullGroup.position.set(-42, 1.5, 58);
    hullGroup.rotation.set(0.15, 0.4, -0.2);

    for (let i = 0; i < 6; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 7), woodMat);
      plank.position.set((i - 2.5) * 1.5, i * 0.4, 0);
      plank.castShadow = true;
      hullGroup.add(plank);
    }
    // Broken mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 12, 8), woodMat);
    mast.position.set(0, 5, 0);
    mast.rotation.z = 0.5;
    mast.castShadow = true;
    hullGroup.add(mast);
    this.scene.add(hullGroup);

    // Shoreline Radio Beacon Tower
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(-28, this.getTerrainHeight(-28, 48), 48);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.2, 11, 6), metalMat);
    tower.position.y = 5.5;
    tower.castShadow = true;
    beaconGroup.add(tower);

    // Beacon Top Red Light (pulsing fault)
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.5
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), bulbMat);
    bulb.position.y = 11.2;
    bulb.name = "beaconBulb";
    beaconGroup.add(bulb);
    this.scene.add(beaconGroup);

    // Add collider
    this.colliders.push({ x: -28, z: 48, radius: 2.0 });
    this.colliders.push({ x: -42, z: 58, radius: 4.5 });
  }

  // Region 2: The Whispering Forest
  buildForestRegion() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x143818, roughness: 0.8 });

    // Populate pine trees
    for (let i = 0; i < 75; i++) {
      const tx = -35 + Math.random() * 45;
      const tz = -15 + Math.random() * 40;
      const ty = this.getTerrainHeight(tx, tz);
      if (ty > 2) {
        const tree = new THREE.Group();
        tree.position.set(tx, ty, tz);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 6, 6), trunkMat);
        trunk.position.y = 3;
        trunk.castShadow = true;
        tree.add(trunk);

        const leaves1 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 5.5, 6), leavesMat);
        leaves1.position.y = 6.5;
        leaves1.castShadow = true;
        tree.add(leaves1);

        const leaves2 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.5, 6), leavesMat);
        leaves2.position.y = 9.5;
        leaves2.castShadow = true;
        tree.add(leaves2);

        this.scene.add(tree);
        this.colliders.push({ x: tx, z: tz, radius: 0.8 });
      }
    }

    // The Ancient Monolith
    const monolithGroup = new THREE.Group();
    const my = this.getTerrainHeight(-15, 6);
    monolithGroup.position.set(-15, my, 6);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.3
    });
    const spire = new THREE.Mesh(new THREE.BoxGeometry(2.5, 12, 2.5), stoneMat);
    spire.position.y = 6;
    spire.castShadow = true;
    monolithGroup.add(spire);

    // Glowing carved runic rings (activated by Echo Vision)
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      wireframe: true
    });
    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.15, 8, 24), runeMat);
    runeRing.position.y = 7;
    runeRing.rotation.x = Math.PI / 2;
    runeRing.name = "monolithRune";
    monolithGroup.add(runeRing);
    this.scene.add(monolithGroup);

    this.colliders.push({ x: -15, z: 6, radius: 2.2 });
  }

  // Region 3: The Sunken Village
  buildVillageRegion() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    // 4 submerged stilt houses
    const huts = [
      { x: 38, z: 36, rot: 0.2 },
      { x: 50, z: 42, rot: -0.4 },
      { x: 42, z: 54, rot: 0.6 },
      { x: 56, z: 56, rot: 0.0 }
    ];
    huts.forEach(h => {
      const hut = new THREE.Group();
      const hy = Math.max(1.0, this.getTerrainHeight(h.x, h.z));
      hut.position.set(h.x, hy, h.z);
      hut.rotation.y = h.rot;

      // Stilts
      for (let s = 0; s < 4; s++) {
        const sx = (s % 2 === 0 ? -2 : 2);
        const sz = (s < 2 ? -2 : 2);
        const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), woodMat);
        stilt.position.set(sx, 1, sz);
        hut.add(stilt);
      }
      // Floor
      const floor = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 5.2), woodMat);
      floor.position.y = 3;
      hut.add(floor);
      // Walls
      const walls = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.5, 4.8), woodMat);
      walls.position.y = 4.8;
      hut.add(walls);
      // Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.5, 4), roofMat);
      roof.position.y = 7.5;
      roof.rotation.y = Math.PI / 4;
      hut.add(roof);

      this.scene.add(hut);
      this.colliders.push({ x: h.x, z: h.z, radius: 3.5 });
    });

    // Giant Sluice Gate Dam Mechanism
    const gateGroup = new THREE.Group();
    gateGroup.position.set(30, 2.5, 26);
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.3 });
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 2), ironMat);
    wall1.position.y = 3;
    gateGroup.add(wall1);

    // Rotating drainage wheel
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.4 });
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.25, 8, 16), wheelMat);
    wheel.position.set(0, 3.5, 1.2);
    wheel.name = "drainageWheel";
    gateGroup.add(wheel);
    this.scene.add(gateGroup);

    this.colliders.push({ x: 30, z: 26, radius: 4.5 });
  }

  // Region 4: The Blackstone Caverns
  buildCavernRegion() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
    const cavernGroup = new THREE.Group();
    cavernGroup.position.set(-45, 4, -50);

    // Cavern arch / overhang
    for (let a = 0; a < 6; a++) {
      const archPillar = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 14, 6), rockMat);
      archPillar.position.set((a - 2.5) * 5, 6, (a % 2 === 0 ? 4 : -4));
      archPillar.rotation.z = (a - 2.5) * 0.1;
      cavernGroup.add(archPillar);
    }

    // Glowing Obsidian Crystals
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0xa855f7,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.8
    });
    for (let c = 0; c < 5; c++) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2 + Math.random() * 0.8, 0), crystalMat);
      crystal.position.set(-8 + c * 4, 1.8, (c % 2 === 0 ? 2 : -2));
      crystal.scale.set(0.8, 2.5, 0.8);
      crystal.name = `crystal_${c}`;
      cavernGroup.add(crystal);

      // Pointlight for crystal glow
      const cLight = new THREE.PointLight(0xa855f7, 0.8, 10);
      cLight.position.set(-8 + c * 4, 2.5, (c % 2 === 0 ? 2 : -2));
      cavernGroup.add(cLight);
    }
    this.scene.add(cavernGroup);
    this.colliders.push({ x: -45, z: -50, radius: 10 });
  }

  // Region 5: The Research Facility
  buildFacilityRegion() {
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    const facGroup = new THREE.Group();
    const fy = this.getTerrainHeight(35, -55);
    facGroup.position.set(35, fy, -55);

    // Main Bunker Block
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 14), concreteMat);
    bunker.position.y = 4;
    bunker.castShadow = true;
    facGroup.add(bunker);

    // Steel Blast Door
    const blastDoor = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.5, 0.6), steelMat);
    blastDoor.position.set(0, 2.8, 7.1);
    blastDoor.name = "facilityBlastDoor";
    facGroup.add(blastDoor);

    // Radar dish
    const dish = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12, 0, Math.PI), steelMat);
    dish.position.set(6, 9.5, 2);
    dish.rotation.x = -Math.PI / 3;
    facGroup.add(dish);

    // Interactive Terminal Screen
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.2
    });
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.8), steelMat);
    terminal.position.set(-3.5, 2.2, 7.6);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), screenMat);
    screen.position.set(-3.5, 2.5, 8.01);
    screen.name = "researchTerminal";
    facGroup.add(terminal);
    facGroup.add(screen);

    this.scene.add(facGroup);
    this.colliders.push({ x: 35, z: -55, radius: 11 });
  }

  // Region 6: The Abyssal Gate
  buildAbyssalGateRegion() {
    const gateGroup = new THREE.Group();
    const gy = this.getTerrainHeight(60, -15);
    gateGroup.position.set(60, gy, -15);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7, metalness: 0.4 });
    // Massive Ring Portal
    const portalArch = new THREE.Mesh(new THREE.TorusGeometry(8, 1.6, 12, 32), stoneMat);
    portalArch.position.y = 9;
    portalArch.rotation.y = Math.PI / 4;
    portalArch.castShadow = true;
    gateGroup.add(portalArch);

    // Ethereal Swirling Particle Vortex
    const vortexGeo = new THREE.BufferGeometry();
    const vCount = 800;
    const vPos = new Float32Array(vCount * 3);
    for (let i = 0; i < vCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 6.5;
      vPos[i] = Math.cos(angle) * r;
      vPos[i + 1] = Math.sin(angle) * r;
      vPos[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    vortexGeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
    const vortexMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.9,
      transparent: true,
      opacity: 0.75
    });
    this.portalVortex = new THREE.Points(vortexGeo, vortexMat);
    this.portalVortex.position.y = 9;
    this.portalVortex.rotation.y = Math.PI / 4;
    gateGroup.add(this.portalVortex);

    // 3 Keystone Altar Pedestals
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    for (let p = 0; p < 3; p++) {
      const angle = (p * Math.PI * 2) / 3;
      const px = Math.cos(angle) * 7;
      const pz = Math.sin(angle) * 7;
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 2.2, 8), altarMat);
      pedestal.position.set(px, 1.1, pz);
      pedestal.name = `pedestal_${p}`;
      gateGroup.add(pedestal);
    }

    this.scene.add(gateGroup);
    this.colliders.push({ x: 60, z: -15, radius: 9 });
  }

  update(delta, playerPos) {
    // Animate Ocean waves
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      const time = performance.now() * 0.0015;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        // Subtle wave displacement
        const wave = Math.sin(u * 0.12 + time) * 0.3 + Math.cos(v * 0.15 + time * 1.2) * 0.25;
        pos.setZ(i, wave);
      }
      this.waterMesh.geometry.computeVertexNormals();
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
    }

    // Portal vortex rotation
    if (this.portalVortex) {
      this.portalVortex.rotation.z += delta * 0.6;
    }

    // Animate Rain in storm weather
    if (this.weather === 'storm' && this.rainParticles) {
      this.rainParticles.material.opacity = 0.75;
      const rPos = this.rainParticles.geometry.attributes.position;
      for (let i = 1; i < rPos.count * 3; i += 3) {
        rPos.array[i] -= delta * 35;
        if (rPos.array[i] < 0) {
          rPos.array[i] = 40;
        }
      }
      rPos.needsUpdate = true;
      // Center rain around player
      if (playerPos) {
        this.rainParticles.position.set(playerPos.x, 0, playerPos.z);
      }
    } else if (this.rainParticles) {
      this.rainParticles.material.opacity = 0.0;
    }

    // Day & Night Orbital Lighting Cycle
    this.timeOfDay = (this.timeOfDay + delta * 0.003) % 1.0;
    const sunAngle = this.timeOfDay * Math.PI * 2;
    const sunDist = 120;
    this.sunLight.position.set(
      Math.cos(sunAngle) * sunDist,
      Math.sin(sunAngle) * sunDist,
      Math.sin(sunAngle * 0.5) * 50
    );

    // Adjust light intensity and fog based on time and weather
    const isDay = Math.sin(sunAngle) > 0;
    const sunHeight = Math.max(0, Math.sin(sunAngle));
    this.sunLight.intensity = sunHeight * (this.weather === 'storm' ? 0.3 : 1.2);

    if (this.stars) {
      this.stars.material.opacity = Math.max(0, 0.9 - sunHeight * 1.5);
    }

    if (this.weather === 'fog') {
      this.scene.fog.density = 0.035;
      this.scene.fog.color.setHex(0x334155);
    } else if (this.weather === 'storm') {
      this.scene.fog.density = 0.028;
      this.scene.fog.color.setHex(0x1e293b);
    } else {
      this.scene.fog.density = 0.015;
      if (isDay) {
        this.scene.fog.color.setHex(0x64748b);
      } else {
        this.scene.fog.color.setHex(0x0a1128);
      }
    }

    // Check Region Discoveries
    if (playerPos) {
      for (const reg of this.regions) {
        const d = Math.hypot(playerPos.x - reg.x, playerPos.z - reg.z);
        if (d < reg.radius && !reg.discovered) {
          reg.discovered = true;
          if (window.onRegionDiscovered) {
            window.onRegionDiscovered(reg);
          }
        }
      }
    }
  }

  getCurrentRegion(x, z) {
    for (const reg of this.regions) {
      const d = Math.hypot(x - reg.x, z - reg.z);
      if (d < reg.radius) return reg;
    }
    return { id: 'wilds', name: 'The Untamed Wilds', discovered: true };
  }

  drainVillageWater() {
    this.waterLevel = -1.5;
    if (this.waterMesh) {
      this.waterMesh.position.y = this.waterLevel;
    }
  }
}

window.IslandGameWorld = IslandGameWorld;
