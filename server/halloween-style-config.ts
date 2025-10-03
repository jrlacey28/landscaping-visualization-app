export interface HalloweenStyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  referenceImages?: string[];
  category: "pumpkins" | "skeletons" | "ghosts" | "witches" | "bats" | "spiders" | "graveyard" | "inflatables" | "animated" | "lights" | "clowns" | "zombies" | "mummies" | "vampires" | "atmosphere";
  regionType: "border" | "garden" | "outdoor";
}

export const HALLOWEEN_STYLE_CONFIG: Record<string, HalloweenStyleConfig> = {
  // Pumpkins
  classic_pumpkins: {
    id: "classic_pumpkins",
    name: "Classic Pumpkins",
    prompt:
      "Add 5-8 carved jack-o'-lanterns with glowing faces on porch and walkway",
    referenceImageUrl: "https://mycdn.com/pumpkins.jpg",
    category: "pumpkins",
    regionType: "outdoor",
  },
  pumpkin_pathway: {
    id: "pumpkin_pathway",
    name: "Pumpkin Pathway",
    prompt:
      "ADD a welcoming Halloween pathway lined with glowing jack-o'-lanterns. Place carved pumpkins (10-16 inches diameter) on both sides of the walkway leading to the front entrance, spaced approximately 3-4 feet apart. Each pumpkin should have a different carved face design with warm orange candlelight glowing from within. Alternate between sitting directly on the ground and elevated on hay bales for visual variety. The pumpkins should appear freshly carved with realistic texture and warm inviting glow.",
    referenceImageUrl: "https://mycdn.com/pumpkin-pathway.jpg",
    category: "pumpkins",
    regionType: "outdoor",
  },
  pumpkin_display: {
    id: "pumpkin_display",
    name: "Pumpkin Display",
    prompt:
      "ADD an impressive pumpkin display with various sizes and styles arranged artistically. Stack and cluster pumpkins of different sizes (from small 6-inch to large 20-inch diameter) on the front porch, steps, or near the entrance. Include traditional orange pumpkins, white ghost pumpkins, and some carved jack-o'-lanterns with glowing faces. Arrange them at different heights using hay bales, wooden crates, or porch railings as platforms. Add dried corn stalks and autumn mums around the display for a festive harvest look.",
    referenceImageUrl: "https://mycdn.com/pumpkin-display.jpg",
    category: "pumpkins",
    regionType: "outdoor",
  },

  // Skeletons
  skeleton_yard_display: {
    id: "skeleton_yard_display",
    name: "Skeleton Yard Display",
    prompt:
      "Add 2-3 life-sized white skeletons in various poses around the yard",
    referenceImageUrl: "https://mycdn.com/skeleton-display.jpg",
    category: "skeletons",
    regionType: "outdoor",
  },
  skeleton_graveyard_scene: {
    id: "skeleton_graveyard_scene",
    name: "Skeleton Graveyard Scene",
    prompt:
      "ADD a spooky skeleton graveyard scene in the front yard. Add 3-4 life-sized skeletons (5-6 feet tall) positioned as if rising from graves, with skeletal hands and arms emerging from the ground. Position foam tombstones (2-3 feet tall) in a small cluster in one area of the lawn with skeletons arranged around and between them. Include ground fog effects at the base for atmosphere. The skeletons should have realistic bone-white weathered appearance with detailed skull features. Add scattered bones and skeletal parts on the ground for extra effect.",
    referenceImageUrl: "https://mycdn.com/skeleton-graveyard.jpg",
    category: "skeletons",
    regionType: "garden",
  },

  // Ghosts
  hanging_ghosts: {
    id: "hanging_ghosts",
    name: "Hanging Ghosts",
    prompt:
      "Add 3-5 white floating ghosts hanging from porch ceiling and tree branches",
    referenceImageUrl: "https://mycdn.com/hanging-ghosts.jpg",
    category: "ghosts",
    regionType: "outdoor",
  },
  ghost_family: {
    id: "ghost_family",
    name: "Ghost Family",
    prompt:
      "ADD a charming ghost family display on the front lawn. Place 4-5 ghost figures of varying heights (2-5 feet tall) positioned together as a family group. Each ghost should be white fabric or foam with simple black facial features (dots for eyes, 'O' shaped mouth). Arrange them in a cluster with different poses - some standing, some appearing to float, one smaller child-sized ghost. They should look friendly and welcoming rather than scary. Position them in one area of the lawn as if greeting visitors. The ghosts should have a soft glow or white illumination for nighttime visibility.",
    referenceImageUrl: "https://mycdn.com/ghost-family.jpg",
    category: "ghosts",
    regionType: "garden",
  },

  // Witches
  witch_crash: {
    id: "witch_crash",
    name: "Witch Crash Landing",
    prompt:
      "ADD a dramatic witch crash scene as if a witch crashed into the house or tree. Show witch's legs (with striped stockings and pointy shoes) sticking out from bushes, porch, or appearing to have crashed into the side of the house with just the legs visible. Add a black pointy witch hat fallen nearby and a crashed broomstick on the ground. This classic Halloween decoration should appear as if the witch crash-landed during flight. The legs should be wearing traditional witch costume with black and orange striped stockings and curl-toed shoes. Keep this playful and humorous.",
    referenceImageUrl: "https://mycdn.com/witch-crash.jpg",
    category: "witches",
    regionType: "outdoor",
  },
  witch_silhouettes: {
    id: "witch_silhouettes",
    name: "Witch Silhouettes",
    prompt:
      "ADD illuminated witch silhouettes visible in windows or as yard stakes. Place 2-3 classic witch silhouettes (3-4 feet tall) showing witches on broomsticks in flying poses. If placing in windows, backlight them from inside to create glowing silhouettes. If in yard, use black metal stakes with witch shapes, possibly with subtle purple or orange backlighting. The witches should have pointed hats, flowing cloaks, and be riding broomsticks in dynamic flying poses. Create a sense of witches soaring across the moon.",
    referenceImageUrl: "https://mycdn.com/witch-silhouettes.jpg",
    category: "witches",
    regionType: "outdoor",
  },

  // Bats
  bat_swarm: {
    id: "bat_swarm",
    name: "Bat Swarm",
    prompt:
      "ADD a dramatic swarm of bats appearing to fly from the house. Place 15-25 black bat decorations (8-14 inch wingspan each) attached to the house exterior, appearing to emerge from under the roof eaves, around the entrance, or from windows. Arrange them in a flowing pattern as if taking flight, with bats at various angles and positions to create motion. The bats should be flat black silhouettes or 3D foam/plastic with detailed wing texture. Cluster them more densely near their origin point (eaves/window) and spread them out as they appear to fly away. This should look like a spooky bat colony emerging at dusk.",
    referenceImageUrl: "https://mycdn.com/bat-swarm.jpg",
    category: "bats",
    regionType: "outdoor",
  },
  hanging_bats: {
    id: "hanging_bats",
    name: "Hanging Bats",
    prompt:
      "ADD hanging bat decorations suspended from porch ceiling and tree branches. Hang 8-12 black bats (6-12 inch wingspan) at varying heights using invisible fishing line from porch overhang, tree branches near the entrance, or eaves. Position them as if hanging upside down (traditional bat resting pose) or in mid-flight at different angles. The bats should be black with detailed wing membrane texture and small red or yellow eyes. Vary the heights from 4-7 feet from ground to create depth and visual interest. Some bats can be clustered in groups of 2-3, others solitary.",
    referenceImageUrl: "https://mycdn.com/hanging-bats.jpg",
    category: "bats",
    regionType: "outdoor",
  },

  // Spiders
  giant_spider: {
    id: "giant_spider",
    name: "Giant Spider",
    prompt:
      "Add one giant black spider (5-foot leg span) crawling on the front of the house",
    referenceImageUrl: "https://mycdn.com/giant-spider.jpg",
    category: "spiders",
    regionType: "outdoor",
  },
  spider_web_display: {
    id: "spider_web_display",
    name: "Spider Web Display",
    prompt:
      "ADD an elaborate spider web display with multiple spiders. Stretch white synthetic spider webbing across porch corners, between porch columns, around the entrance, or in bushes near the front door. The webbing should look like giant spider webs (3-6 feet diameter) with realistic strand patterns. Add 4-6 black spiders of varying sizes (from 8-inch to 20-inch leg span) positioned on and around the webs as if they built and inhabit them. Include one larger spider as the centerpiece. The webs should have a slightly translucent appearance with realistic geometric patterns. Add a few wrapped 'victims' (wrapped white cocoon shapes) caught in the web for extra effect.",
    referenceImageUrl: "https://mycdn.com/spider-webs.jpg",
    category: "spiders",
    regionType: "outdoor",
  },

  // Graveyard
  tombstone_graveyard: {
    id: "tombstone_graveyard",
    name: "Tombstone Graveyard",
    prompt:
      "Add 6-8 gray tombstones arranged as a graveyard in one section of the lawn with ground fog",
    referenceImageUrl: "https://mycdn.com/graveyard.jpg",
    category: "graveyard",
    regionType: "garden",
  },
  graveyard_fence: {
    id: "graveyard_fence",
    name: "Graveyard with Fence",
    prompt:
      "ADD a classic graveyard scene with decorative fencing. Install black or gray plastic/metal graveyard fencing (2-3 feet tall with pointed posts and chain/bar details) to section off a small area of the front yard (approximately 8x8 feet). Inside the fenced area, place 4-6 tombstones (2-3 feet tall) with weathered stone appearance, various epitaphs, and aged details. Add skeletal remains, crows, and ground fog for atmosphere. Position a decorative entrance gate (slightly ajar for spooky effect) at the front. The fencing should look like old wrought iron with gothic details. Include dim lighting (purple, blue, or green) for nighttime visibility.",
    referenceImageUrl: "https://mycdn.com/graveyard-fence.jpg",
    category: "graveyard",
    regionType: "garden",
  },

  // Giant Skeleton
  giant_skeleton: {
    id: "giant_skeleton",
    name: "Giant Skeleton",
    prompt:
      "Add one 12-foot tall white skeleton standing in the front yard with glowing eyes",
    referenceImageUrl: "https://mycdn.com/giant-skeleton.jpg",
    category: "skeletons",
    regionType: "outdoor",
  },

  // Inflatable Characters
  inflatable_giant_pumpkin: {
    id: "inflatable_giant_pumpkin",
    name: "Giant Pumpkin Inflatable",
    prompt:
      "ADD a large inflatable jack-o'-lantern decoration in the front yard. Place an oversized inflatable pumpkin (6-8 feet tall and wide) with a carved smiling or spooky face, glowing from internal LED lights. The inflatable should be bright orange with a green stem on top, appearing round and plump. Position it prominently on the lawn where it's visible from the street. The inflatable should look festive and well-lit at night with warm orange glow. Include the slight wrinkles and seams typical of inflatable decorations for realism.",
    referenceImageUrl: "https://mycdn.com/inflatable-pumpkin.jpg",
    category: "inflatables",
    regionType: "outdoor",
  },
  inflatable_grim_reaper: {
    id: "inflatable_grim_reaper",
    name: "Grim Reaper Inflatable",
    prompt:
      "Add one 8-foot tall inflatable Grim Reaper with black robe and scythe, glowing from within",
    referenceImageUrl: "https://mycdn.com/inflatable-reaper.jpg",
    category: "inflatables",
    regionType: "outdoor",
  },
  inflatable_haunted_tree: {
    id: "inflatable_haunted_tree",
    name: "Haunted Tree Inflatable",
    prompt:
      "ADD a spooky inflatable haunted tree decoration to the yard. Place a 7-9 foot tall inflatable dead tree with gnarled twisted branches, carved scary face on the trunk, and eerie lighting. The tree should be dark brown/black with gnarly texture, bare twisted branches reaching out, and a menacing face carved or formed in the trunk. Add glowing eyes or mouth lit from within. Position it in the yard where it creates a spooky focal point. The tree should look ancient and haunted with weathered bark texture.",
    referenceImageUrl: "https://mycdn.com/inflatable-tree.jpg",
    category: "inflatables",
    regionType: "outdoor",
  },

  // Animated Props
  animated_heads: {
    id: "animated_heads",
    name: "Animated Talking Heads",
    prompt:
      "ADD animated talking head props to the Halloween display. Place 2-3 disembodied animated heads (12-16 inches tall) positioned on fence posts, porch railings, or stakes in the yard. The heads should appear to be talking, singing, or moving with mechanical animation - mouths opening and closing, eyes moving, heads turning side to side. Make them look like severed zombie or monster heads with detailed facial features, realistic skin texture, and eerie expressions. Add subtle lighting on each head. They should look like they're interacting with visitors.",
    referenceImageUrl: "https://mycdn.com/animated-heads.jpg",
    category: "animated",
    regionType: "outdoor",
  },
  animated_talking_pumpkin: {
    id: "animated_talking_pumpkin",
    name: "Talking Pumpkin",
    prompt:
      "ADD an animated talking jack-o'-lantern prop to the display. Place a medium to large carved pumpkin (14-18 inches diameter) with an animated projected face that talks, sings, or tells jokes. The pumpkin should have a traditional orange appearance with the face projection showing expressive eyes and mouth that move realistically as if speaking. Add warm internal glow. Position it on the porch, steps, or prominent location where visitors can see and hear it. The face projection should look like it's carved into the pumpkin with realistic lighting effects.",
    referenceImageUrl: "https://mycdn.com/talking-pumpkin.jpg",
    category: "animated",
    regionType: "outdoor",
  },
  animated_jumping_spider: {
    id: "animated_jumping_spider",
    name: "Jumping Spider",
    prompt:
      "ADD an animated jumping spider prop that drops down to startle visitors. Install a large black spider (2-3 feet leg span) suspended above the walkway or porch entrance with a drop-down mechanism. The spider should appear to be hanging on a web strand, ready to drop down when activated. Show it in either the raised position or mid-drop. The spider should be black with detailed hairy legs, realistic body segments, and glowing red eyes. Include visible web strand or cable it hangs from. Position it where it would surprise people approaching the entrance.",
    referenceImageUrl: "https://mycdn.com/jumping-spider.jpg",
    category: "animated",
    regionType: "outdoor",
  },

  // Haunted Pathway Lights
  skull_torch_lights: {
    id: "skull_torch_lights",
    name: "LED Skull Torches",
    prompt:
      "ADD LED skull torch pathway lights leading to the entrance. Place 6-10 illuminated skull torches (18-24 inches tall) lining both sides of the walkway, spaced evenly every 3-4 feet. Each torch should be a realistic white/gray skull on a stake with flickering LED flame effect emanating from the top. The skulls should have detailed bone texture and hollow eye sockets. The flame effect should glow orange/red with realistic flickering. They should create an eerie but festive pathway to the door. Position them along the walkway or driveway edges for maximum effect.",
    referenceImageUrl: "https://mycdn.com/skull-torches.jpg",
    category: "lights",
    regionType: "outdoor",
  },
  flickering_lanterns: {
    id: "flickering_lanterns",
    name: "Flickering Lanterns",
    prompt:
      "ADD antique-style flickering lanterns throughout the Halloween display. Place 5-8 old-fashioned lanterns (12-16 inches tall) on the porch, steps, along walkway, or hanging from shepherd's hooks in the yard. Each lantern should be black metal with glass panels showing flickering LED candlelight or flame effect inside. The flickering should create an eerie, haunted atmosphere. Mix placement styles: some sitting on surfaces, some hanging from hooks or tree branches, some along the pathway. The lanterns should look aged and weathered with vintage metal finish.",
    referenceImageUrl: "https://mycdn.com/flickering-lanterns.jpg",
    category: "lights",
    regionType: "outdoor",
  },

  // Clowns
  creepy_carnival_clowns: {
    id: "creepy_carnival_clowns",
    name: "Creepy Carnival Clowns",
    prompt:
      "Add 2-3 creepy clown figures with distorted makeup positioned around the yard",
    referenceImageUrl: "https://mycdn.com/creepy-clowns.jpg",
    category: "clowns",
    regionType: "outdoor",
  },
  circus_tent_display: {
    id: "circus_tent_display",
    name: "Haunted Circus Tent",
    prompt:
      "ADD a miniature haunted circus tent display in the front yard. Set up a small striped circus tent (6-8 feet wide, 6-7 feet tall) with red and white or black and white weathered stripes. Add creepy carnival elements around it: distorted clown figures, vintage circus posters, aged carnival props, and eerie lighting (purple, red, or flickering). The tent should look abandoned and haunted with tattered fabric and faded colors. Position circus clown decorations near the entrance. Add ground fog for atmosphere. This should evoke an unsettling abandoned carnival feel.",
    referenceImageUrl: "https://mycdn.com/circus-tent.jpg",
    category: "clowns",
    regionType: "garden",
  },

  // Zombies
  groundbreaker_zombies: {
    id: "groundbreaker_zombies",
    name: "Groundbreaker Zombies",
    prompt:
      "Add 3-4 zombie figures emerging from the ground with arms reaching up",
    referenceImageUrl: "https://mycdn.com/groundbreaker-zombies.jpg",
    category: "zombies",
    regionType: "garden",
  },
  zombie_horde: {
    id: "zombie_horde",
    name: "Zombie Horde",
    prompt:
      "ADD a zombie horde scene with multiple undead figures shambling across the yard. Place 5-7 life-sized zombie figures (5-6 feet tall) positioned throughout the front yard in various walking/lurching poses, appearing to approach the house. Each zombie should have unique characteristics: tattered clothing, decayed appearance, reaching arms, distressed faces. Arrange them in a group formation moving from one side toward the entrance. Add eerie green or blue lighting on the figures. The zombies should look authentically undead with detailed makeup and costumes but remain appropriate for families.",
    referenceImageUrl: "https://mycdn.com/zombie-horde.jpg",
    category: "zombies",
    regionType: "garden",
  },

  // Mummies
  wrapped_mummies: {
    id: "wrapped_mummies",
    name: "Wrapped Mummies",
    prompt:
      "Add 2-3 mummy figures wrapped in white bandages with arms outstretched in the yard",
    referenceImageUrl: "https://mycdn.com/wrapped-mummies.jpg",
    category: "mummies",
    regionType: "outdoor",
  },
  tomb_display: {
    id: "tomb_display",
    name: "Egyptian Tomb Display",
    prompt:
      "ADD an Egyptian tomb-themed mummy display. Create a small tomb entrance facade (4-6 feet tall) with hieroglyphic decorations and Egyptian motifs positioned in the yard. Place 2-3 mummy figures wrapped in ancient bandages positioned around or emerging from the tomb entrance. Add golden/amber lighting effects, aged stone textures, and scattered Egyptian props (urns, canopic jars, treasure). The mummies should look ancient with weathered wrappings. Include swirling sand/fog effects at ground level. This should evoke the atmosphere of an archeological dig or ancient Egyptian burial site.",
    referenceImageUrl: "https://mycdn.com/tomb-display.jpg",
    category: "mummies",
    regionType: "garden",
  },

  // Vampires
  vampire_silhouettes: {
    id: "vampire_silhouettes",
    name: "Vampire Silhouettes",
    prompt:
      "ADD dramatic vampire silhouettes to create a Dracula-themed display. Place 2-3 vampire figure silhouettes (5-6 feet tall) in classic poses - cape spread wide, dramatic stance, or looming presence. Position them as window backlights (illuminated from behind) or as standing figures with dramatic red backlighting. The vampires should have classic features: long cape, formal attire, distinctive collar. Add subtle red accent lighting to create an ominous atmosphere. Position them to cast dramatic shadows and create a sense of the undead lurking nearby.",
    referenceImageUrl: "https://mycdn.com/vampire-silhouettes.jpg",
    category: "vampires",
    regionType: "outdoor",
  },
  coffin_setup: {
    id: "coffin_setup",
    name: "Vampire Coffin Setup",
    prompt:
      "ADD a vampire coffin scene to the Halloween display. Place a dark wooden coffin (6-7 feet long) positioned on the lawn or porch, either closed or with the lid partially open. Add a life-sized vampire figure (5-6 feet tall) either lying in the coffin or emerging from it in dramatic pose. The vampire should wear formal Victorian attire with cape, pale face makeup, and fangs. Include dramatic red or purple lighting focused on the coffin. Add ground fog swirling around the base. Position scattered earth or dirt around the coffin as if freshly unearthed. The scene should be theatrical and gothic.",
    referenceImageUrl: "https://mycdn.com/coffin-setup.jpg",
    category: "vampires",
    regionType: "outdoor",
  },

  // Atmosphere Effects
  night_mode: {
    id: "night_mode",
    name: "Night Mode",
    prompt:
      "CONVERT SCENE TO NIGHTTIME while keeping all decorations visible: Change the entire scene from daytime to nighttime to show how Halloween decorations will look after dark. Convert sky to deep twilight blue or dark night sky with twinkling stars. Add a normal full moon (soft white/pale yellow glow) in the sky. Transform all lighting to evening/night conditions: warm yellow glow from house windows, soft landscape lighting, porch lights glowing, street lights visible in background. Darken the overall scene appropriately for nighttime but maintain excellent visibility of ALL decorations. Make grass appear darker blue-green in moonlight. Deepen shadows for nighttime atmosphere. This is a straightforward day-to-night conversion with natural nighttime lighting - no fog, no colored lights, no dramatic effects. Keep atmosphere natural and realistic for a regular Halloween night.",
    referenceImageUrl: "https://mycdn.com/night-mode.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
  really_spooky: {
    id: "really_spooky",
    name: "Really Spooky Mode",
    prompt:
      "ADD DRAMATIC SPOOKY ATMOSPHERE to the scene: Transform this into a dramatically spooky Halloween night with theatrical effects. Change to nighttime with dark midnight blue-black sky. Add a large blood moon (orange-red tinted full moon) or dramatic moon breaking through ominous dark clouds. ADD thick atmospheric ground fog (1-2 feet deep) rolling dramatically across the entire lawn. Transform lighting to dramatic Halloween theatrical effects: eerie orange glow from windows, purple and green accent lights on house exterior, blue-white uplighting on trees, colored spotlights highlighting decorations. Add volumetric fog/mist effects swirling throughout for mystery and atmosphere. Create stark dramatic shadows with theatrical rim lighting on structures. Make grass appear dark black-green in the eerie moonlight. Add subtle light rays breaking through clouds from moon. The overall atmosphere should feel like a Halloween movie scene - genuinely spooky, dramatic, and theatrical with professional haunted house lighting.",
    referenceImageUrl: "https://mycdn.com/spooky-atmosphere.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
  spooky_lighting: {
    id: "spooky_lighting",
    name: "Spooky Lighting",
    prompt:
      "ADD dramatic Halloween lighting effects to enhance the spooky atmosphere. Install orange, purple, green, and blue uplighting aimed at the house exterior, trees, and key features. Add warm orange glow emanating from all windows as if lit from within. Place purple or green spotlights creating dramatic shadows and highlighting decorations. Add string lights in orange and purple colors along the roofline or porch. Include flickering light effects to simulate candles or torches. Create colored light wash on the house facade (purple on one side, orange on another). The lighting should be theatrical and dramatic, creating a spooky but festive Halloween atmosphere.",
    referenceImageUrl: "https://mycdn.com/spooky-lighting.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
};
