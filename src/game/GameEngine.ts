import * as THREE from 'three';
import { ActivePowerUp, Lane, PowerUpType } from '../types/game';
import { sound } from '../services/sound';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, distance: number) => void;
  onGoldCollect: (totalRunGold: number) => void;
  onPowerUpChange: (powerUps: ActivePowerUp[]) => void;
  onThiefHit: (hits: number) => void;
  onGameOver: (summary: { score: number; distance: number; gold: number; thiefHits: number }) => void;
  onJump: () => void;
  onSlide: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private isPaused = false;

  // Character config
  public characterId = 'tom';
  public characterColor = '#94a3b8';

  // Game state
  private score = 0;
  private distance = 0;
  private goldCollected = 0;
  private thiefHits = 0;
  private scoreMultiplier = 1;

  // Speeds & physics
  private baseSpeed = 19;
  private currentSpeed = 19;
  private maxSpeed = 35;
  private currentLane: Lane = 0;
  private targetLaneX = 0;
  private currentLaneX = 0;
  private laneWidth = 2.6;

  // Player jumping/sliding physics
  private playerY = 0;
  private playerVelocityY = 0;
  private isGrounded = true;
  private isSliding = false;
  private slideTimer = 0;
  private slideDuration = 0.65;
  private gravity = -42;
  private jumpForce = 13.5;

  // 3D Objects
  private playerGroup!: THREE.Group;
  private playerMeshParts: {
    head: THREE.Mesh;
    body: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftEar: THREE.Mesh;
    rightEar: THREE.Mesh;
    tail: THREE.Mesh;
    bandana?: THREE.Mesh;
    shieldMesh?: THREE.Mesh;
    jetpackMesh?: THREE.Group;
  } = {} as any;
  private playerShadow!: THREE.Mesh;

  // Thief (Roy Rakoon)
  private thiefGroup!: THREE.Group;
  private thiefDistanceAhead = 20; // meters ahead of player
  private thiefLane: Lane = 0;
  private thiefLaneChangeTimer = 0;
  private thiefSackDropTimer = 0;
  private thiefCatchupPhase = false;
  private thiefTumbleTimer = 0;

  // Environment & Track Chunks
  private trackChunks: THREE.Group[] = [];
  private chunkLength = 50;
  private chunkCount = 5;
  private nextChunkZ = 0;

  // Dynamic entities on track
  private obstacles: {
    mesh: THREE.Object3D;
    lane: Lane;
    z: number;
    type: 'LOW_HURDLE' | 'HIGH_SIGN' | 'TRUCK' | 'TRAMPOLINE';
    active: boolean;
  }[] = [];

  private collectibles: {
    mesh: THREE.Object3D;
    lane: Lane;
    z: number;
    y: number;
    type: 'GOLD' | 'SAFE' | PowerUpType;
    active: boolean;
  }[] = [];

  private particles: {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }[] = [];

  // Active Power-Ups
  private activePowerUps: Map<PowerUpType, { remaining: number; duration: number }> = new Map();

  // Character bonus perks
  public magnetBonusSec = 0;
  public jetpackBonusSec = 0;
  public multiplierBonus = 1;

  // Materials & Geometries reusable caches
  private materialsCache: Map<string, THREE.Material> = new Map();

  // Time tracking
  private lastTime = 0;
  private runAnimTime = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initThree();
    this.buildWorld();
    this.buildPlayer();
    this.buildThief();
    this.spawnInitialChunks();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7ec0ee); // Bright cartoon sky
    this.scene.fog = new THREE.FogExp2(0x7ec0ee, 0.009);

    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 400);
    this.camera.position.set(0, 4.2, 7.5);
    this.camera.lookAt(0, 1.8, -12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Responsive resize handler
    window.addEventListener('resize', this.onWindowResize);

    // Studio & Sunshine lighting
    const ambientLight = new THREE.AmbientLight(0xfff7e6, 0.7);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x7ec0ee, 0x4d7c0f, 0.45);
    this.scene.add(hemiLight);
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private buildWorld() {
    // Add distant decorative clouds in the sunny sky
    const cloudGeo = new THREE.DodecahedronGeometry(4, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
    });

    for (let i = 0; i < 18; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 160,
        28 + Math.random() * 20,
        -50 - Math.random() * 200
      );
      const s = 1.2 + Math.random() * 1.5;
      cloud.scale.set(s * 1.8, s, s);
      this.scene.add(cloud);
    }
  }

  public setCharacter(charId: string, color: string, perkMulti: number, magnetBonus: number, jetpackBonus: number) {
    this.characterId = charId;
    this.characterColor = color;
    this.scoreMultiplier = perkMulti;
    this.magnetBonusSec = magnetBonus;
    this.jetpackBonusSec = jetpackBonus;

    if (this.playerGroup) {
      this.scene.remove(this.playerGroup);
      this.buildPlayer();
    }
  }

  public setScoreMultiplier(multiplier: number) {
    this.scoreMultiplier = multiplier;
  }

  private buildPlayer() {
    this.playerGroup = new THREE.Group();

    // Body Material based on character
    const furColor = this.characterColor;
    const furMat = new THREE.MeshStandardMaterial({
      color: furColor,
      roughness: 0.55,
      metalness: 0.05,
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.4,
    });
    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });

    // Torso
    const bodyGeo = new THREE.CapsuleGeometry(0.38, 0.55, 6, 12);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.position.y = 0.85;
    body.castShadow = true;
    this.playerGroup.add(body);
    this.playerMeshParts.body = body;

    // Head
    const headGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const head = new THREE.Mesh(headGeo, furMat);
    head.position.y = 1.6;
    head.castShadow = true;
    this.playerGroup.add(head);
    this.playerMeshParts.head = head;

    // Cat / Dog Ears
    const earGeo = new THREE.ConeGeometry(0.18, 0.35, 6);
    const leftEar = new THREE.Mesh(earGeo, furMat);
    leftEar.position.set(-0.3, 2.05, 0.05);
    leftEar.rotation.z = 0.25;
    this.playerGroup.add(leftEar);
    this.playerMeshParts.leftEar = leftEar;

    const rightEar = new THREE.Mesh(earGeo, furMat);
    rightEar.position.set(0.3, 2.05, 0.05);
    rightEar.rotation.z = -0.25;
    this.playerGroup.add(rightEar);
    this.playerMeshParts.rightEar = rightEar;

    // Cute inner ear pink patches
    const innerEarGeo = new THREE.ConeGeometry(0.1, 0.22, 6);
    const innerEarL = new THREE.Mesh(innerEarGeo, pinkMat);
    innerEarL.position.set(-0.29, 2.03, 0.07);
    innerEarL.rotation.z = 0.25;
    this.playerGroup.add(innerEarL);

    const innerEarR = new THREE.Mesh(innerEarGeo, pinkMat);
    innerEarR.position.set(0.29, 2.03, 0.07);
    innerEarR.rotation.z = -0.25;
    this.playerGroup.add(innerEarR);

    // Muzzle
    const muzzleGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const muzzle = new THREE.Mesh(muzzleGeo, whiteMat);
    muzzle.position.set(0, 1.48, 0.32);
    muzzle.scale.set(1.2, 0.85, 0.8);
    this.playerGroup.add(muzzle);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nose = new THREE.Mesh(noseGeo, pinkMat);
    nose.position.set(0, 1.55, 0.49);
    this.playerGroup.add(nose);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.16, 1.66, 0.38);
    leftEye.scale.set(0.7, 1.1, 0.6);
    this.playerGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.16, 1.66, 0.38);
    rightEye.scale.set(0.7, 1.1, 0.6);
    this.playerGroup.add(rightEye);

    // Signature Blue Bandana / Scarf for Tom
    const bandanaGeo = new THREE.TorusGeometry(0.36, 0.09, 8, 16);
    const bandana = new THREE.Mesh(bandanaGeo, blueMat);
    bandana.position.set(0, 1.25, 0.05);
    bandana.rotation.x = Math.PI / 2;
    this.playerGroup.add(bandana);
    this.playerMeshParts.bandana = bandana;

    // Limbs - Arms
    const limbMat = furMat;
    const armGeo = new THREE.CapsuleGeometry(0.12, 0.42, 6, 8);

    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.48, 0.85, 0);
    leftArm.castShadow = true;
    this.playerGroup.add(leftArm);
    this.playerMeshParts.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.48, 0.85, 0);
    rightArm.castShadow = true;
    this.playerGroup.add(rightArm);
    this.playerMeshParts.rightArm = rightArm;

    // Limbs - Legs
    const legGeo = new THREE.CapsuleGeometry(0.14, 0.45, 6, 8);

    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.position.set(-0.2, 0.38, 0);
    leftLeg.castShadow = true;
    this.playerGroup.add(leftLeg);
    this.playerMeshParts.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.position.set(0.2, 0.38, 0);
    rightLeg.castShadow = true;
    this.playerGroup.add(rightLeg);
    this.playerMeshParts.rightLeg = rightLeg;

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8);
    const tail = new THREE.Mesh(tailGeo, furMat);
    tail.position.set(0, 0.65, -0.4);
    tail.rotation.x = -Math.PI / 3;
    this.playerGroup.add(tail);
    this.playerMeshParts.tail = tail;

    // Protective Helmet / Shield bubble (hidden by default)
    const shieldGeo = new THREE.SphereGeometry(1.2, 20, 20);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.9,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.y = 1.1;
    shieldMesh.visible = false;
    this.playerGroup.add(shieldMesh);
    this.playerMeshParts.shieldMesh = shieldMesh;

    // Jetpack backpack (hidden by default)
    const jetpackGroup = new THREE.Group();
    const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.65, 10);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });
    const thrusterL = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterL.position.set(-0.28, 0.85, -0.4);
    const thrusterR = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterR.position.set(0.28, 0.85, -0.4);
    jetpackGroup.add(thrusterL);
    jetpackGroup.add(thrusterR);
    jetpackGroup.visible = false;
    this.playerGroup.add(jetpackGroup);
    this.playerMeshParts.jetpackMesh = jetpackGroup;

    // Dynamic ground blob shadow
    const shadowGeo = new THREE.CircleGeometry(0.65, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0a192f,
      transparent: true,
      opacity: 0.35,
    });
    this.playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.y = 0.02;
    this.scene.add(this.playerShadow);

    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);
  }

  private buildThief() {
    // Roy Rakoon - The sneaky raccoon with mask and striped tail holding loot sack
    this.thiefGroup = new THREE.Group();

    const thiefFurMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const maskMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.36, 0.5, 6, 12);
    const body = new THREE.Mesh(bodyGeo, thiefFurMat);
    body.position.y = 0.8;
    this.thiefGroup.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.42, 14, 14);
    const head = new THREE.Mesh(headGeo, thiefFurMat);
    head.position.y = 1.5;
    this.thiefGroup.add(head);

    // Raccoon Bandit Mask
    const maskGeo = new THREE.BoxGeometry(0.7, 0.22, 0.1);
    const mask = new THREE.Mesh(maskGeo, maskMat);
    mask.position.set(0, 1.54, 0.38);
    this.thiefGroup.add(mask);

    // Big Raccoon Ears
    const earGeo = new THREE.ConeGeometry(0.18, 0.3, 6);
    const leftEar = new THREE.Mesh(earGeo, thiefFurMat);
    leftEar.position.set(-0.3, 1.9, 0);
    leftEar.rotation.z = 0.3;
    const rightEar = new THREE.Mesh(earGeo, thiefFurMat);
    rightEar.position.set(0.3, 1.9, 0);
    rightEar.rotation.z = -0.3;
    this.thiefGroup.add(leftEar);
    this.thiefGroup.add(rightEar);

    // Giant Stolen Gold Loot Sack
    const sackGeo = new THREE.DodecahedronGeometry(0.45, 1);
    const sack = new THREE.Mesh(sackGeo, sackMat);
    sack.position.set(0.38, 0.95, -0.15);
    sack.scale.set(1.1, 1.3, 1.1);
    this.thiefGroup.add(sack);

    // Gold coins peeking out of sack
    const coinGoldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    });
    const coinGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
    for (let c = 0; c < 3; c++) {
      const coin = new THREE.Mesh(coinGeo, coinGoldMat);
      coin.position.set(0.38 + (c - 1) * 0.12, 1.45, -0.15);
      coin.rotation.x = Math.PI / 4;
      this.thiefGroup.add(coin);
    }

    // Striped bushy tail
    const tailGeo = new THREE.CylinderGeometry(0.14, 0.1, 0.75, 8);
    const tail = new THREE.Mesh(tailGeo, maskMat);
    tail.position.set(0, 0.6, -0.5);
    tail.rotation.x = -Math.PI / 3.5;
    this.thiefGroup.add(tail);

    this.thiefGroup.position.set(0, 0, -this.thiefDistanceAhead);
    this.scene.add(this.thiefGroup);
  }

  private createRoadChunk(chunkZ: number): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = chunkZ;

    // Asphalt Road
    const roadWidth = this.laneWidth * 3 + 2; // ~9.8m
    const roadGeo = new THREE.PlaneGeometry(roadWidth, this.chunkLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark asphalt
      roughness: 0.85,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    chunk.add(road);

    // Yellow Dash Lane Markings
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const dashGeo = new THREE.PlaneGeometry(0.18, 3.2);

    // Left divider (-1.3) and Right divider (+1.3)
    const dividers = [-this.laneWidth / 2, this.laneWidth / 2];
    for (const divX of dividers) {
      for (let z = -this.chunkLength / 2 + 3; z < this.chunkLength / 2; z += 6.5) {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(divX, 0.015, z);
        chunk.add(dash);
      }
    }

    // Concrete Sidewalk Curbs
    const curbGeo = new THREE.BoxGeometry(0.8, 0.25, this.chunkLength);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-roadWidth / 2 - 0.4, 0.1, 0);
    chunk.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(roadWidth / 2 + 0.4, 0.1, 0);
    chunk.add(rightCurb);

    // Green Grass Verges
    const grassGeo = new THREE.PlaneGeometry(35, this.chunkLength);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 });

    const leftGrass = new THREE.Mesh(grassGeo, grassMat);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-roadWidth / 2 - 18, -0.02, 0);
    leftGrass.receiveShadow = true;
    chunk.add(leftGrass);

    const rightGrass = new THREE.Mesh(grassGeo, grassMat);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(roadWidth / 2 + 18, -0.02, 0);
    rightGrass.receiveShadow = true;
    chunk.add(rightGrass);

    // Decorative Street Props (Palm trees, street lights, cute suburban houses)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });

    for (let z = -this.chunkLength / 2 + 8; z < this.chunkLength / 2; z += 16) {
      // Palm Tree on left
      const trunkL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4.5, 6), trunkMat);
      trunkL.position.set(-roadWidth / 2 - 3, 2.2, z);
      const palmL = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), foliageMat);
      palmL.position.set(-roadWidth / 2 - 3, 4.8, z);
      palmL.scale.set(1.5, 0.9, 1.5);
      chunk.add(trunkL);
      chunk.add(palmL);

      // Cute Suburban Villa facade on right
      const houseMat = new THREE.MeshStandardMaterial({
        color: z % 32 === 0 ? 0xfecdd3 : 0xfef08a,
        roughness: 0.6,
      });
      const houseRoofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });

      const houseBox = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 8), houseMat);
      houseBox.position.set(roadWidth / 2 + 7.5, 2, z);
      const houseRoof = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 4), houseRoofMat);
      houseRoof.rotation.y = Math.PI / 4;
      houseRoof.position.set(roadWidth / 2 + 7.5, 5.1, z);
      chunk.add(houseBox);
      chunk.add(houseRoof);
    }

    return chunk;
  }

  private spawnInitialChunks() {
    this.nextChunkZ = 0;
    for (let i = 0; i < this.chunkCount; i++) {
      const chunk = this.createRoadChunk(this.nextChunkZ);
      this.trackChunks.push(chunk);
      this.scene.add(chunk);

      // Do not populate obstacles on the first chunk so player has safe start
      if (i > 0) {
        this.populateChunkEntities(this.nextChunkZ);
      }
      this.nextChunkZ -= this.chunkLength;
    }
  }

  private populateChunkEntities(chunkCenterZ: number) {
    const lanes: Lane[] = [-1, 0, 1];
    const halfLen = this.chunkLength / 2 - 6;

    // 1. Spawn Obstacles
    const obstacleCount = 2 + Math.floor(Math.random() * 2);
    const usedZ = new Set<number>();

    for (let o = 0; o < obstacleCount; o++) {
      const relZ = Math.floor((Math.random() - 0.5) * halfLen * 2);
      const worldZ = chunkCenterZ + relZ;

      // Avoid overlapping too close
      let tooClose = false;
      for (const z of usedZ) {
        if (Math.abs(z - worldZ) < 8) tooClose = true;
      }
      if (tooClose) continue;
      usedZ.add(worldZ);

      const targetLane = lanes[Math.floor(Math.random() * lanes.length)];
      const obsTypeRand = Math.random();

      if (obsTypeRand < 0.35) {
        // Low Hurdle (Road barrier) - Jumpable!
        const hurdleMesh = this.createLowHurdleMesh();
        hurdleMesh.position.set(targetLane * this.laneWidth, 0, worldZ);
        this.scene.add(hurdleMesh);
        this.obstacles.push({
          mesh: hurdleMesh,
          lane: targetLane,
          z: worldZ,
          type: 'LOW_HURDLE',
          active: true,
        });

        // Spawn gold arc over the hurdle!
        this.spawnGoldArc(targetLane, worldZ);
      } else if (obsTypeRand < 0.65) {
        // High Highway Sign / Boom Gate - Slideable!
        const signMesh = this.createHighSignMesh();
        signMesh.position.set(targetLane * this.laneWidth, 0, worldZ);
        this.scene.add(signMesh);
        this.obstacles.push({
          mesh: signMesh,
          lane: targetLane,
          z: worldZ,
          type: 'HIGH_SIGN',
          active: true,
        });

        // Spawn a row of gold under the sign
        this.spawnGoldLine(targetLane, worldZ - 3, worldZ + 3, 0.4);
      } else if (obsTypeRand < 0.88) {
        // Delivery Van / Bandit Truck - Tall obstacle, must dodge lane!
        const truckMesh = this.createTruckMesh();
        truckMesh.position.set(targetLane * this.laneWidth, 0, worldZ);
        this.scene.add(truckMesh);
        this.obstacles.push({
          mesh: truckMesh,
          lane: targetLane,
          z: worldZ,
          type: 'TRUCK',
          active: true,
        });
      } else {
        // Trampoline / Spring Pad - Bounces Tom high over hazards!
        const trampolineMesh = this.createTrampolineMesh();
        trampolineMesh.position.set(targetLane * this.laneWidth, 0, worldZ);
        this.scene.add(trampolineMesh);
        this.obstacles.push({
          mesh: trampolineMesh,
          lane: targetLane,
          z: worldZ,
          type: 'TRAMPOLINE',
          active: true,
        });

        // Sky high arc of gold
        for (let g = 0; g < 6; g++) {
          const goldMesh = this.createGoldBarMesh();
          const gz = worldZ - 4 - g * 3.5;
          const gy = 3.8 + Math.sin((g / 5) * Math.PI) * 2.2;
          goldMesh.position.set(targetLane * this.laneWidth, gy, gz);
          this.scene.add(goldMesh);
          this.collectibles.push({
            mesh: goldMesh,
            lane: targetLane,
            z: gz,
            y: gy,
            type: 'GOLD',
            active: true,
          });
        }
      }
    }

    // 2. Spawn Gold Lines in remaining lanes
    for (const lane of lanes) {
      if (Math.random() < 0.55) {
        const startZ = chunkCenterZ - 14 + (Math.random() - 0.5) * 8;
        this.spawnGoldLine(lane, startZ, startZ - 16, 0.5);
      }
    }

    // 3. Rare Power-Up Spawn
    if (Math.random() < 0.4) {
      const powerUpTypes: PowerUpType[] = ['MAGNET', 'HELMET', 'MULTIPLIER', 'JETPACK', 'SNEAKERS'];
      const pType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      const pLane = lanes[Math.floor(Math.random() * lanes.length)];
      const pZ = chunkCenterZ + (Math.random() - 0.5) * 20;

      const pMesh = this.createPowerUpMesh(pType);
      pMesh.position.set(pLane * this.laneWidth, 1.2, pZ);
      this.scene.add(pMesh);
      this.collectibles.push({
        mesh: pMesh,
        lane: pLane,
        z: pZ,
        y: 1.2,
        type: pType,
        active: true,
      });
    }

    // 4. Very rare Gold Vault Safe box!
    if (Math.random() < 0.15) {
      const safeLane = lanes[Math.floor(Math.random() * lanes.length)];
      const safeZ = chunkCenterZ + (Math.random() - 0.5) * 15;
      const safeMesh = this.createSafeBoxMesh();
      safeMesh.position.set(safeLane * this.laneWidth, 0.6, safeZ);
      this.scene.add(safeMesh);
      this.collectibles.push({
        mesh: safeMesh,
        lane: safeLane,
        z: safeZ,
        y: 0.6,
        type: 'SAFE',
        active: true,
      });
    }
  }

  private createLowHurdleMesh(): THREE.Group {
    const group = new THREE.Group();
    // Striped Red and White Roadblock
    const barGeo = new THREE.BoxGeometry(2.3, 0.45, 0.18);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 0.55;
    bar.castShadow = true;
    group.add(bar);

    // White stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stripeGeo = new THREE.BoxGeometry(0.35, 0.47, 0.2);
    for (let s = -0.7; s <= 0.7; s += 0.7) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(s, 0.55, 0);
      group.add(stripe);
    }

    // Legs / supports
    const legGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.95, 0.4, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.95, 0.4, 0);
    group.add(legL);
    group.add(legR);

    return group;
  }

  private createHighSignMesh(): THREE.Group {
    const group = new THREE.Group();
    // High overhead Highway Sign - Clear space underneath to slide!
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 }); // Highway green

    // Two tall poles
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    const poleL = new THREE.Mesh(poleGeo, postMat);
    poleL.position.set(-1.15, 1.6, 0);
    const poleR = new THREE.Mesh(poleGeo, postMat);
    poleR.position.set(1.15, 1.6, 0);
    group.add(poleL);
    group.add(poleR);

    // Overhead sign board (y: 2.3 to 3.1, leaving 1.8m clearance for slide)
    const boardGeo = new THREE.BoxGeometry(2.4, 0.85, 0.16);
    const board = new THREE.Mesh(boardGeo, signMat);
    board.position.set(0, 2.5, 0);
    board.castShadow = true;
    group.add(board);

    // Highway Arrow / Warning marker
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const arrow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.18), yellowMat);
    arrow.position.set(0, 2.3, 0);
    group.add(arrow);

    return group;
  }

  private createTruckMesh(): THREE.Group {
    const group = new THREE.Group();

    // Cartoon Delivery Truck (Cannot be jumped or slid under!)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // Cargo Box
    const cargoGeo = new THREE.BoxGeometry(2.0, 2.4, 3.6);
    const cargo = new THREE.Mesh(cargoGeo, cargoMat);
    cargo.position.set(0, 1.6, 0.5);
    cargo.castShadow = true;
    group.add(cargo);

    // Front Cabin
    const cabinGeo = new THREE.BoxGeometry(1.9, 1.6, 1.3);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.15, -1.6);
    cabin.castShadow = true;
    group.add(cabin);

    // Front Windshield
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.1), glassMat);
    glass.position.set(0, 1.45, -2.26);
    group.add(glass);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    const wheelPositions = [
      [-1.0, 0.35, -1.2],
      [1.0, 0.35, -1.2],
      [-1.0, 0.35, 1.4],
      [1.0, 0.35, 1.4],
    ];
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    }

    return group;
  }

  private createTrampolineMesh(): THREE.Group {
    const group = new THREE.Group();
    // Bouncy orange trampoline pad
    const frameGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.4 });
    const pad = new THREE.Mesh(frameGeo, frameMat);
    pad.position.y = 0.15;
    group.add(pad);

    const canvasGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.22, 16);
    const canvasMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });
    const bounceCanvas = new THREE.Mesh(canvasGeo, canvasMat);
    bounceCanvas.position.y = 0.16;
    group.add(bounceCanvas);

    return group;
  }

  private createGoldBarMesh(): THREE.Group {
    const group = new THREE.Group();
    // Realistic 3D Ingot Shape (Trapezoidal prism / beveled bar)
    const ingotGeo = new THREE.BoxGeometry(0.48, 0.22, 0.32);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.95,
      roughness: 0.18,
    });

    const ingot = new THREE.Mesh(ingotGeo, goldMat);
    ingot.castShadow = true;
    group.add(ingot);

    // Stamp mark on top
    const stampGeo = new THREE.BoxGeometry(0.3, 0.02, 0.18);
    const stampMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const stamp = new THREE.Mesh(stampGeo, stampMat);
    stamp.position.y = 0.115;
    group.add(stamp);

    return group;
  }

  private createSafeBoxMesh(): THREE.Group {
    const group = new THREE.Group();
    // Heavy metal Gold Safe with spinning dial
    const boxGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const safeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3,
    });
    const box = new THREE.Mesh(boxGeo, safeMat);
    box.castShadow = true;
    group.add(box);

    // Gold trim
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    });
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), trimMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 0, 0.44);
    group.add(dial);

    return group;
  }

  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();

    if (type === 'MAGNET') {
      // Red Horseshoe Magnet
      const torusGeo = new THREE.TorusGeometry(0.35, 0.12, 10, 16, Math.PI);
      const magMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4 });
      const torus = new THREE.Mesh(torusGeo, magMat);
      torus.rotation.z = Math.PI;
      group.add(torus);

      // Silver tips
      const tipGeo = new THREE.BoxGeometry(0.24, 0.22, 0.24);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 });
      const tipL = new THREE.Mesh(tipGeo, tipMat);
      tipL.position.set(-0.35, 0.1, 0);
      const tipR = new THREE.Mesh(tipGeo, tipMat);
      tipR.position.set(0.35, 0.1, 0);
      group.add(tipL);
      group.add(tipR);
    } else if (type === 'HELMET') {
      // Cyan Safety Helmet
      const sphereGeo = new THREE.SphereGeometry(0.38, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      const helmMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.6 });
      const helm = new THREE.Mesh(sphereGeo, helmMat);
      group.add(helm);
    } else if (type === 'MULTIPLIER') {
      // Golden '2X' Star / Medallion
      const starGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 8);
      const starMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
      const star = new THREE.Mesh(starGeo, starMat);
      star.rotation.x = Math.PI / 2;
      group.add(star);
    } else if (type === 'JETPACK') {
      // Rocket Thruster Pack
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.65, 12);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.7 });
      const rocket = new THREE.Mesh(bodyGeo, rocketMat);
      group.add(rocket);
    } else {
      // Sneakers / Spring Shoe
      const shoeGeo = new THREE.BoxGeometry(0.35, 0.25, 0.65);
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      group.add(shoe);
    }

    // Glowing halo ring around every power-up
    const haloGeo = new THREE.RingGeometry(0.55, 0.65, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    return group;
  }

  private spawnGoldLine(lane: Lane, startZ: number, endZ: number, y = 0.5) {
    const step = 2.4;
    for (let z = Math.max(startZ, endZ); z >= Math.min(startZ, endZ); z -= step) {
      const gold = this.createGoldBarMesh();
      gold.position.set(lane * this.laneWidth, y, z);
      this.scene.add(gold);
      this.collectibles.push({
        mesh: gold,
        lane,
        z,
        y,
        type: 'GOLD',
        active: true,
      });
    }
  }

  private spawnGoldArc(lane: Lane, centerZ: number) {
    // 5 Gold bars in an upward parabola over the low hurdle
    const count = 5;
    for (let i = 0; i < count; i++) {
      const norm = (i / (count - 1)) * 2 - 1; // -1 to +1
      const gz = centerZ + norm * 3.5;
      const gy = 0.6 + (1 - norm * norm) * 1.8; // Peak at 2.4m
      const gold = this.createGoldBarMesh();
      gold.position.set(lane * this.laneWidth, gy, gz);
      this.scene.add(gold);
      this.collectibles.push({
        mesh: gold,
        lane,
        z: gz,
        y: gy,
        type: 'GOLD',
        active: true,
      });
    }
  }

  // Particle explosion on gold collect, safe open, or crash
  private createSparkleBurst(x: number, y: number, z: number, color = 0xffd700, count = 12) {
    const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const pMat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const speed = 4 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * Math.cos(pitch) * speed,
        vy: Math.sin(pitch) * speed + 2,
        vz: Math.sin(angle) * Math.cos(pitch) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
      });
    }
  }

  // --- Input Handlers ---
  public moveLeft() {
    if (!this.isRunning || this.isPaused) return;
    if (this.currentLane > -1) {
      this.currentLane = (this.currentLane - 1) as Lane;
      this.targetLaneX = this.currentLane * this.laneWidth;
      sound.playLaneChange();
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isPaused) return;
    if (this.currentLane < 1) {
      this.currentLane = (this.currentLane + 1) as Lane;
      this.targetLaneX = this.currentLane * this.laneWidth;
      sound.playLaneChange();
    }
  }

  public jump() {
    if (!this.isRunning || this.isPaused) return;
    if (this.isGrounded && !this.isSliding) {
      const boost = this.activePowerUps.has('SNEAKERS') ? 1.45 : 1.0;
      this.playerVelocityY = this.jumpForce * boost;
      this.isGrounded = false;
      sound.playJump();
      this.callbacks.onJump();
    }
  }

  public slide() {
    if (!this.isRunning || this.isPaused) return;
    // If mid-air, fast-drop to ground
    if (!this.isGrounded) {
      this.playerVelocityY = -28;
    }
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    sound.playSlide();
    this.callbacks.onSlide();
  }

  // --- Power-up Activation ---
  private activatePowerUp(type: PowerUpType) {
    let durationSec = 10;
    if (type === 'MAGNET') durationSec = 10 + this.magnetBonusSec;
    if (type === 'JETPACK') durationSec = 8 + this.jetpackBonusSec;
    if (type === 'HELMET') durationSec = 14;
    if (type === 'MULTIPLIER') durationSec = 12;
    if (type === 'SNEAKERS') durationSec = 10;

    const durationMs = durationSec * 1000;
    this.activePowerUps.set(type, {
      remaining: durationMs,
      duration: durationMs,
    });

    sound.playPowerUp();

    if (type === 'HELMET' && this.playerMeshParts.shieldMesh) {
      this.playerMeshParts.shieldMesh.visible = true;
      (this.playerMeshParts.shieldMesh.material as THREE.MeshStandardMaterial).opacity = 0.45;
    }

    if (type === 'JETPACK' && this.playerMeshParts.jetpackMesh) {
      this.playerMeshParts.jetpackMesh.visible = true;
    }

    this.notifyPowerUps();
  }

  private notifyPowerUps() {
    const list: ActivePowerUp[] = [];
    this.activePowerUps.forEach((val, key) => {
      list.push({
        type: key,
        remaining: val.remaining,
        duration: val.duration,
      });
    });
    this.callbacks.onPowerUpChange(list);
  }

  // --- Main Game Loop ---
  private animate = (timestamp: number) => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    if (this.isPaused) return;

    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.runAnimTime += dt;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number) {
    // 1. Dynamic speed scaling
    this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * 0.005);
    const moveDist = this.currentSpeed * dt;
    this.distance += moveDist;

    // Multiplier bonus calculation
    const has2x = this.activePowerUps.has('MULTIPLIER') ? 2 : 1;
    const finalMultiplier = this.scoreMultiplier * has2x;
    this.score += Math.round(moveDist * 1.5 * finalMultiplier);
    this.callbacks.onScoreUpdate(this.score, Math.floor(this.distance));

    // 2. Power-up Timers
    const toRemove: PowerUpType[] = [];
    this.activePowerUps.forEach((val, key) => {
      val.remaining -= dt * 1000;
      if (val.remaining <= 0) {
        toRemove.push(key);
      }
    });

    if (toRemove.length > 0) {
      for (const t of toRemove) {
        this.activePowerUps.delete(t);
        if (t === 'HELMET' && this.playerMeshParts.shieldMesh) {
          this.playerMeshParts.shieldMesh.visible = false;
        }
        if (t === 'JETPACK' && this.playerMeshParts.jetpackMesh) {
          this.playerMeshParts.jetpackMesh.visible = false;
        }
      }
      this.notifyPowerUps();
    }

    // 3. Player Horizontal Lane Lerping
    this.currentLaneX += (this.targetLaneX - this.currentLaneX) * Math.min(dt * 15, 1);
    this.playerGroup.position.x = this.currentLaneX;

    // Banking tilt when switching lanes
    const laneDelta = this.targetLaneX - this.currentLaneX;
    this.playerGroup.rotation.z = -laneDelta * 0.18;

    // 4. Vertical Physics (Jumping / Jetpack / Sliding)
    const isJetpackActive = this.activePowerUps.has('JETPACK');

    if (isJetpackActive) {
      // Ascend to high altitude sky lane
      const targetSkyY = 6.8;
      this.playerY += (targetSkyY - this.playerY) * dt * 4;
      this.playerVelocityY = 0;
      this.isGrounded = false;
    } else {
      // Normal ground gravity
      this.playerVelocityY += this.gravity * dt;
      this.playerY += this.playerVelocityY * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVelocityY = 0;
        this.isGrounded = true;
      }
    }

    this.playerGroup.position.y = this.playerY;

    // Player Shadow follows ground
    if (this.playerShadow) {
      this.playerShadow.position.x = this.currentLaneX;
      const shadowScale = Math.max(0.2, 1 - this.playerY * 0.15);
      this.playerShadow.scale.set(shadowScale, shadowScale, 1);
      this.playerShadow.visible = this.playerY < 6;
    }

    // 5. Sliding timer & scale
    if (this.isSliding) {
      this.slideTimer -= dt;
      this.playerGroup.scale.set(1.25, 0.45, 1.25);
      this.playerGroup.rotation.x = Math.PI / 4;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.playerGroup.scale.set(1, 1, 1);
        this.playerGroup.rotation.x = 0;
      }
    } else {
      this.playerGroup.scale.set(1, 1, 1);
      this.playerGroup.rotation.x = 0;
    }

    // 6. Running Animation Rig (Arms & Legs cycle)
    if (this.isGrounded && !this.isSliding) {
      const runCycle = Math.sin(this.runAnimTime * 18);
      if (this.playerMeshParts.leftLeg) this.playerMeshParts.leftLeg.rotation.x = runCycle * 0.8;
      if (this.playerMeshParts.rightLeg) this.playerMeshParts.rightLeg.rotation.x = -runCycle * 0.8;
      if (this.playerMeshParts.leftArm) this.playerMeshParts.leftArm.rotation.x = -runCycle * 0.8;
      if (this.playerMeshParts.rightArm) this.playerMeshParts.rightArm.rotation.x = runCycle * 0.8;
      if (this.playerMeshParts.tail) this.playerMeshParts.tail.rotation.z = Math.sin(this.runAnimTime * 12) * 0.3;
    } else if (!this.isGrounded && !isJetpackActive) {
      // In-air jump pose
      if (this.playerMeshParts.leftLeg) this.playerMeshParts.leftLeg.rotation.x = -0.5;
      if (this.playerMeshParts.rightLeg) this.playerMeshParts.rightLeg.rotation.x = 0.5;
      if (this.playerMeshParts.leftArm) this.playerMeshParts.leftArm.rotation.x = 1.2;
      if (this.playerMeshParts.rightArm) this.playerMeshParts.rightArm.rotation.x = 1.2;
    }

    // 7. Track Chunks scrolling
    for (const chunk of this.trackChunks) {
      chunk.position.z += moveDist;
      // If chunk is far behind camera, recycle it to the front
      if (chunk.position.z > this.chunkLength * 1.5) {
        chunk.position.z = this.nextChunkZ;
        this.nextChunkZ -= this.chunkLength;
        this.populateChunkEntities(chunk.position.z);
      }
    }

    // 8. Move and check Obstacles
    const playerRadius = 0.5;
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      obs.z += moveDist;
      obs.mesh.position.z = obs.z;

      // Obstacle behind player
      if (obs.z > 8) {
        obs.active = false;
        this.scene.remove(obs.mesh);
        continue;
      }

      // Collision check with player
      // Only check if player is close on Z axis (within 1.1m)
      if (Math.abs(obs.z) < 1.1) {
        // If jetpack is active, player flies high over all ground obstacles!
        if (isJetpackActive) continue;

        // Check horizontal lane overlap
        const obsLaneX = obs.lane * this.laneWidth;
        if (Math.abs(this.currentLaneX - obsLaneX) < 1.0) {
          // Check type-specific pass clearance:
          if (obs.type === 'LOW_HURDLE') {
            // Must jump over hurdle
            if (this.playerY > 1.1) {
              // Jumped successfully!
              continue;
            }
          } else if (obs.type === 'HIGH_SIGN') {
            // Must slide under high sign
            if (this.isSliding) {
              // Slid successfully!
              continue;
            }
          } else if (obs.type === 'TRAMPOLINE') {
            // Bounce Tom sky high!
            this.playerVelocityY = 24;
            this.isGrounded = false;
            sound.playJump();
            obs.active = false;
            continue;
          }

          // Crash occurred!
          if (this.activePowerUps.has('HELMET')) {
            // Shield absorbs crash!
            this.activePowerUps.delete('HELMET');
            if (this.playerMeshParts.shieldMesh) {
              this.playerMeshParts.shieldMesh.visible = false;
            }
            sound.playShieldBreak();
            this.createSparkleBurst(this.currentLaneX, 1.2, 0, 0x38bdf8, 20);
            obs.active = false;
            this.scene.remove(obs.mesh);
            this.notifyPowerUps();
            continue;
          } else {
            // Fatal crash - Game Over!
            this.triggerGameOver();
            return;
          }
        }
      }
    }

    // 9. Collectibles (Gold bars, Power-ups, Safe boxes)
    const isMagnetActive = this.activePowerUps.has('MAGNET');
    for (const item of this.collectibles) {
      if (!item.active) continue;
      item.z += moveDist;
      item.mesh.position.z = item.z;

      // Rotation & bobbing
      item.mesh.rotation.y += dt * 3.5;

      // Magnet attraction
      if (isMagnetActive && item.type === 'GOLD') {
        const dx = this.currentLaneX - item.mesh.position.x;
        const dy = (this.playerY + 0.8) - item.mesh.position.y;
        const dz = 0 - item.z;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distToPlayer < 14) {
          item.mesh.position.x += dx * dt * 9;
          item.mesh.position.y += dy * dt * 9;
          item.z += dz * dt * 9;
        }
      }

      // Check pickup radius
      const itemX = item.mesh.position.x;
      const itemY = item.mesh.position.y;
      const distX = Math.abs(this.currentLaneX - itemX);
      const distY = Math.abs(this.playerY + 0.6 - itemY);
      const distZ = Math.abs(item.z);

      if (distX < 1.1 && distY < 1.5 && distZ < 1.3) {
        // Collected!
        item.active = false;
        this.scene.remove(item.mesh);

        if (item.type === 'GOLD') {
          const goldAmount = has2x;
          this.goldCollected += goldAmount;
          this.score += 50 * finalMultiplier;
          sound.playCoin();
          this.callbacks.onGoldCollect(this.goldCollected);
          this.createSparkleBurst(itemX, itemY, item.z, 0xffd700, 8);
        } else if (item.type === 'SAFE') {
          // Safe gives 25 gold + score burst
          this.goldCollected += 25;
          this.score += 1000 * finalMultiplier;
          sound.playFanfare();
          this.callbacks.onGoldCollect(this.goldCollected);
          this.createSparkleBurst(itemX, itemY, item.z, 0x38bdf8, 25);
        } else {
          // Power-up
          this.activatePowerUp(item.type as PowerUpType);
          this.createSparkleBurst(itemX, itemY, item.z, 0xec4899, 16);
        }
      }

      // Discard item if behind camera
      if (item.z > 10) {
        item.active = false;
        this.scene.remove(item.mesh);
      }
    }

    // 10. Thief (Roy Rakoon) Chase AI
    this.updateThief(dt, moveDist);

    // 11. Particles Update
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const part = this.particles[p];
      part.life -= dt;
      part.mesh.position.x += part.vx * dt;
      part.mesh.position.y += part.vy * dt;
      part.mesh.position.z += part.vz * dt;
      part.vy -= 12 * dt; // particle gravity

      if (part.life <= 0) {
        this.scene.remove(part.mesh);
        this.particles.splice(p, 1);
      }
    }

    // 12. Camera Follow Choreography
    const targetCamX = this.currentLaneX * 0.35;
    const targetCamY = isJetpackActive ? 8.2 : 3.8 + this.playerY * 0.35;
    this.camera.position.x += (targetCamX - this.camera.position.x) * dt * 8;
    this.camera.position.y += (targetCamY - this.camera.position.y) * dt * 6;
    this.camera.lookAt(this.currentLaneX * 0.2, 1.8 + this.playerY * 0.4, -14);
  }

  private updateThief(dt: number, moveDist: number) {
    if (!this.thiefGroup) return;

    // Roy Rakoon running animation
    const thiefRunCycle = Math.sin(this.runAnimTime * 16);
    this.thiefGroup.rotation.y = Math.PI + Math.sin(this.runAnimTime * 3) * 0.15; // Looks slightly back!

    // Thief distance management: Every 250m, Tom catches up to bump Roy Rakoon!
    const cycleDistance = this.distance % 250;
    if (cycleDistance > 180 && cycleDistance < 240) {
      this.thiefCatchupPhase = true;
      // Close distance to ~4-6 meters!
      this.thiefDistanceAhead += (5.5 - this.thiefDistanceAhead) * dt * 1.5;
    } else {
      this.thiefCatchupPhase = false;
      // Normal lead distance of 20 meters
      this.thiefDistanceAhead += (20 - this.thiefDistanceAhead) * dt * 2.0;
    }

    // Thief Lane changing
    this.thiefLaneChangeTimer -= dt;
    if (this.thiefLaneChangeTimer <= 0) {
      this.thiefLaneChangeTimer = 2.5 + Math.random() * 2;
      const lanes: Lane[] = [-1, 0, 1];
      this.thiefLane = lanes[Math.floor(Math.random() * lanes.length)];
    }

    const targetThiefX = this.thiefLane * this.laneWidth;
    this.thiefGroup.position.x += (targetThiefX - this.thiefGroup.position.x) * dt * 5;
    this.thiefGroup.position.z = -this.thiefDistanceAhead;

    // Thief drops gold coins from leaking sack!
    this.thiefSackDropTimer -= dt;
    if (this.thiefSackDropTimer <= 0) {
      this.thiefSackDropTimer = 0.8 + Math.random() * 0.5;
      const gold = this.createGoldBarMesh();
      const dropZ = this.thiefGroup.position.z + 1.5;
      gold.position.set(this.thiefGroup.position.x, 0.45, dropZ);
      this.scene.add(gold);
      this.collectibles.push({
        mesh: gold,
        lane: this.thiefLane,
        z: dropZ,
        y: 0.45,
        type: 'GOLD',
        active: true,
      });
    }

    // Bumping the Thief during catchup phase!
    if (this.thiefCatchupPhase && Math.abs(this.thiefDistanceAhead) < 6.5) {
      if (Math.abs(this.currentLaneX - this.thiefGroup.position.x) < 1.2 && this.playerY < 1.5) {
        // Hit Roy Rakoon!
        this.thiefHits++;
        this.goldCollected += 15;
        this.score += 2500 * this.scoreMultiplier;
        sound.playThiefHit();
        this.callbacks.onThiefHit(this.thiefHits);
        this.callbacks.onGoldCollect(this.goldCollected);

        // Huge gold scatter explosion!
        this.createSparkleBurst(this.thiefGroup.position.x, 1.2, this.thiefGroup.position.z, 0xffd700, 24);

        // Roy shoots ahead in surprise
        this.thiefDistanceAhead = 25;
      }
    }
  }

  private triggerGameOver() {
    this.isRunning = false;
    sound.playCrash();

    // Tumble animation for player
    if (this.playerGroup) {
      this.playerGroup.rotation.z = Math.PI / 2;
      this.playerGroup.position.y = 0.3;
    }

    this.callbacks.onGameOver({
      score: this.score,
      distance: Math.floor(this.distance),
      gold: this.goldCollected,
      thiefHits: this.thiefHits,
    });
  }

  // --- Public Lifecycle Controls ---
  public start() {
    this.resetRunState();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = 0;
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  public revive() {
    // Revive player from a crash using 1 Dynamite!
    this.isRunning = true;
    this.isPaused = false;
    this.playerY = 0;
    this.playerVelocityY = 0;
    this.isGrounded = true;
    this.isSliding = false;

    if (this.playerGroup) {
      this.playerGroup.rotation.z = 0;
      this.playerGroup.rotation.x = 0;
    }

    // Give temporary 4-second helmet shield so player does not immediately die
    this.activatePowerUp('HELMET');
    this.lastTime = 0;
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resetRunState() {
    this.score = 0;
    this.distance = 0;
    this.goldCollected = 0;
    this.thiefHits = 0;
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.playerY = 0;
    this.playerVelocityY = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.activePowerUps.clear();
    this.notifyPowerUps();

    // Clear dynamic entities
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];

    for (const item of this.collectibles) {
      this.scene.remove(item.mesh);
    }
    this.collectibles = [];

    for (const part of this.particles) {
      this.scene.remove(part.mesh);
    }
    this.particles = [];

    // Reset chunks
    for (const chunk of this.trackChunks) {
      this.scene.remove(chunk);
    }
    this.trackChunks = [];
    this.spawnInitialChunks();

    // Reset player & thief positions
    if (this.playerGroup) {
      this.playerGroup.position.set(0, 0, 0);
      this.playerGroup.rotation.set(0, 0, 0);
      this.playerGroup.scale.set(1, 1, 1);
    }
    if (this.thiefGroup) {
      this.thiefDistanceAhead = 20;
      this.thiefGroup.position.set(0, 0, -20);
    }
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
