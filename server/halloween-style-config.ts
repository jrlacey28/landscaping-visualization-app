export interface HalloweenStyleConfig {
  id: string;
  name: string;
  prompt: string;
  referenceImageUrl: string;
  referenceImages?: string[];
  category: "pumpkins" | "skeletons" | "ghosts" | "witches" | "bats" | "spiders" | "graveyard" | "atmosphere";
  regionType: "border" | "garden" | "outdoor";
}

export const HALLOWEEN_STYLE_CONFIG: Record<string, HalloweenStyleConfig> = {
  // Pumpkins
  classic_pumpkins: {
    id: "classic_pumpkins",
    name: "Classic Pumpkins",
    prompt:
      "Add festive carved jack-o'-lanterns and decorative pumpkins throughout the yard. Place medium to large orange pumpkins (12-18 inches diameter) with traditional carved faces showing warm glowing candlelight from within. Arrange them on the front porch steps, along walkways, and clustered near the entrance. Include a mix of carved and uncarved pumpkins in various sizes. The pumpkins should look realistic with natural orange coloring and green stems. Position them naturally as if placed for Halloween decoration. Keep all existing house structure, landscaping, trees, plants, and yard features completely unchanged.",
    referenceImageUrl: "https://mycdn.com/pumpkins.jpg",
    category: "pumpkins",
    regionType: "outdoor",
  },
  pumpkin_pathway: {
    id: "pumpkin_pathway",
    name: "Pumpkin Pathway",
    prompt:
      "Create a welcoming Halloween pathway lined with glowing jack-o'-lanterns. Place carved pumpkins (10-16 inches diameter) on both sides of the walkway leading to the front entrance, spaced approximately 3-4 feet apart. Each pumpkin should have a different carved face design with warm orange candlelight glowing from within. Alternate between sitting directly on the ground and elevated on hay bales for visual variety. The pumpkins should appear freshly carved with realistic texture and warm inviting glow. Preserve all existing house structure, landscaping, walkways, plants, and yard layout exactly as they are.",
    referenceImageUrl: "https://mycdn.com/pumpkin-pathway.jpg",
    category: "pumpkins",
    regionType: "outdoor",
  },
  pumpkin_display: {
    id: "pumpkin_display",
    name: "Pumpkin Display",
    prompt:
      "Create an impressive pumpkin display with various sizes and styles arranged artistically. Stack and cluster pumpkins of different sizes (from small 6-inch to large 20-inch diameter) on the front porch, steps, or near the entrance. Include traditional orange pumpkins, white ghost pumpkins, and some carved jack-o'-lanterns with glowing faces. Arrange them at different heights using hay bales, wooden crates, or porch railings as platforms. Add dried corn stalks and autumn mums around the display for a festive harvest look. Keep all existing house structure, doors, windows, landscaping, and yard features completely preserved.",
    referenceImageUrl: "https://mycdn.com/pumpkin-display.jpg",
    category: "pumpkins",
    regionType: "outdoor",
  },

  // Skeletons
  skeleton_yard_display: {
    id: "skeleton_yard_display",
    name: "Skeleton Yard Display",
    prompt:
      "Add life-sized realistic skeleton decorations positioned throughout the front yard. Place 5-6 foot tall poseable skeletons in playful or spooky poses - one emerging from the ground near landscaping beds, one sitting on the front porch, one climbing up the side of the house or porch column. The skeletons should be anatomically detailed with weathered bone-white coloring and realistic joints. Position them to look like they're interacting with the environment (reaching toward the door, waving at visitors, etc.). Make them festive but family-friendly. Keep all existing house structure, windows, doors, landscaping, trees, and yard features exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/skeleton-display.jpg",
    category: "skeletons",
    regionType: "outdoor",
  },
  skeleton_graveyard_scene: {
    id: "skeleton_graveyard_scene",
    name: "Skeleton Graveyard Scene",
    prompt:
      "Create a spooky skeleton graveyard scene in the front yard. Add 3-4 life-sized skeletons (5-6 feet tall) positioned as if rising from graves, with skeletal hands and arms emerging from the ground. Position foam tombstones (2-3 feet tall) in a small cluster in one area of the lawn with skeletons arranged around and between them. Include ground fog effects at the base for atmosphere. The skeletons should have realistic bone-white weathered appearance with detailed skull features. Add scattered bones and skeletal parts on the ground for extra effect. This should look like an eerie graveyard scene while keeping all existing house structure, landscaping, plants, trees, and overall yard layout completely preserved.",
    referenceImageUrl: "https://mycdn.com/skeleton-graveyard.jpg",
    category: "skeletons",
    regionType: "garden",
  },

  // Ghosts
  hanging_ghosts: {
    id: "hanging_ghosts",
    name: "Hanging Ghosts",
    prompt:
      "Add floating ghost decorations suspended around the porch and entrance area. Hang 3-5 white fabric ghosts (3-4 feet tall) from porch ceiling, tree branches, or eaves using invisible fishing line to create a floating effect. Each ghost should be made of flowing white fabric with black eyes and mouth, appearing to drift in the breeze. Position them at varying heights (4-8 feet from ground) to create depth. The ghosts should look ethereal and friendly-spooky rather than terrifying. Some can have arms outstretched, others in swooping poses. Keep all existing house structure, roof, landscaping, trees, and yard features exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/hanging-ghosts.jpg",
    category: "ghosts",
    regionType: "outdoor",
  },
  ghost_family: {
    id: "ghost_family",
    name: "Ghost Family",
    prompt:
      "Create a charming ghost family display on the front lawn. Place 4-5 ghost figures of varying heights (2-5 feet tall) positioned together as a family group. Each ghost should be white fabric or foam with simple black facial features (dots for eyes, 'O' shaped mouth). Arrange them in a cluster with different poses - some standing, some appearing to float, one smaller child-sized ghost. They should look friendly and welcoming rather than scary. Position them in one area of the lawn as if greeting visitors. The ghosts should have a soft glow or white illumination for nighttime visibility. Preserve all existing house structure, landscaping, plants, trees, and yard layout exactly as they are.",
    referenceImageUrl: "https://mycdn.com/ghost-family.jpg",
    category: "ghosts",
    regionType: "garden",
  },

  // Witches
  witch_crash: {
    id: "witch_crash",
    name: "Witch Crash Landing",
    prompt:
      "Create a dramatic witch crash scene as if a witch crashed into the house or tree. Show witch's legs (with striped stockings and pointy shoes) sticking out from bushes, porch, or appearing to have crashed into the side of the house with just the legs visible. Add a black pointy witch hat fallen nearby and a crashed broomstick on the ground. This classic Halloween decoration should appear as if the witch crash-landed during flight. The legs should be wearing traditional witch costume with black and orange striped stockings and curl-toed shoes. Keep this playful and humorous. Preserve all existing house structure, windows, doors, landscaping, and yard features completely unchanged.",
    referenceImageUrl: "https://mycdn.com/witch-crash.jpg",
    category: "witches",
    regionType: "outdoor",
  },
  witch_silhouettes: {
    id: "witch_silhouettes",
    name: "Witch Silhouettes",
    prompt:
      "Add illuminated witch silhouettes visible in windows or as yard stakes. Place 2-3 classic witch silhouettes (3-4 feet tall) showing witches on broomsticks in flying poses. If placing in windows, backlight them from inside to create glowing silhouettes. If in yard, use black metal stakes with witch shapes, possibly with subtle purple or orange backlighting. The witches should have pointed hats, flowing cloaks, and be riding broomsticks in dynamic flying poses. Create a sense of witches soaring across the moon. Keep all existing house structure, window frames, landscaping, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/witch-silhouettes.jpg",
    category: "witches",
    regionType: "outdoor",
  },

  // Bats
  bat_swarm: {
    id: "bat_swarm",
    name: "Bat Swarm",
    prompt:
      "Add a dramatic swarm of bats appearing to fly from the house. Place 15-25 black bat decorations (8-14 inch wingspan each) attached to the house exterior, appearing to emerge from under the roof eaves, around the entrance, or from windows. Arrange them in a flowing pattern as if taking flight, with bats at various angles and positions to create motion. The bats should be flat black silhouettes or 3D foam/plastic with detailed wing texture. Cluster them more densely near their origin point (eaves/window) and spread them out as they appear to fly away. This should look like a spooky bat colony emerging at dusk. Keep all existing house structure, siding, windows, roof, landscaping, and yard completely unchanged.",
    referenceImageUrl: "https://mycdn.com/bat-swarm.jpg",
    category: "bats",
    regionType: "outdoor",
  },
  hanging_bats: {
    id: "hanging_bats",
    name: "Hanging Bats",
    prompt:
      "Add hanging bat decorations suspended from porch ceiling and tree branches. Hang 8-12 black bats (6-12 inch wingspan) at varying heights using invisible fishing line from porch overhang, tree branches near the entrance, or eaves. Position them as if hanging upside down (traditional bat resting pose) or in mid-flight at different angles. The bats should be black with detailed wing membrane texture and small red or yellow eyes. Vary the heights from 4-7 feet from ground to create depth and visual interest. Some bats can be clustered in groups of 2-3, others solitary. Keep all existing house structure, roof, trees, landscaping, and yard features exactly preserved.",
    referenceImageUrl: "https://mycdn.com/hanging-bats.jpg",
    category: "bats",
    regionType: "outdoor",
  },

  // Spiders
  giant_spider: {
    id: "giant_spider",
    name: "Giant Spider",
    prompt:
      "Add a large realistic-looking spider decoration on the house exterior. Place one oversized spider (4-6 feet leg span) positioned on the front of the house, appearing to crawl on the siding, near the entrance, or on the porch. The spider should be black or dark gray with detailed hairy legs, realistic body segments, and multiple red or green eyes. Position it at a dramatic angle as if actively crawling. The spider should look three-dimensional with bendable legs in a natural crawling pose. Make it large enough to be a focal point but keep it realistic and detailed rather than cartoonish. Preserve all existing house structure, siding, windows, doors, landscaping, and yard features completely unchanged.",
    referenceImageUrl: "https://mycdn.com/giant-spider.jpg",
    category: "spiders",
    regionType: "outdoor",
  },
  spider_web_display: {
    id: "spider_web_display",
    name: "Spider Web Display",
    prompt:
      "Create an elaborate spider web display with multiple spiders. Stretch white synthetic spider webbing across porch corners, between porch columns, around the entrance, or in bushes near the front door. The webbing should look like giant spider webs (3-6 feet diameter) with realistic strand patterns. Add 4-6 black spiders of varying sizes (from 8-inch to 20-inch leg span) positioned on and around the webs as if they built and inhabit them. Include one larger spider as the centerpiece. The webs should have a slightly translucent appearance with realistic geometric patterns. Add a few wrapped 'victims' (wrapped white cocoon shapes) caught in the web for extra effect. Keep all existing house structure, columns, landscaping, and yard features exactly as they are.",
    referenceImageUrl: "https://mycdn.com/spider-webs.jpg",
    category: "spiders",
    regionType: "outdoor",
  },

  // Graveyard
  tombstone_graveyard: {
    id: "tombstone_graveyard",
    name: "Tombstone Graveyard",
    prompt:
      "Create a spooky miniature graveyard scene in the front yard. Place 6-10 foam or plastic tombstones (2-3 feet tall) arranged in a clustered graveyard layout in one section of the lawn. The tombstones should have weathered gray stone appearance with cracks, moss texture, and various epitaphs (RIP, carved names, dates, humorous sayings). Position them at slightly different angles and depths as if in an old cemetery. Add ground fog effects at the base and dim purple or blue ground lighting for nighttime atmosphere. Include a few skeletal hands reaching up from the ground between tombstones. The overall scene should be spooky but family-friendly. Keep all existing house structure, landscaping, trees, plants, and overall yard layout completely preserved.",
    referenceImageUrl: "https://mycdn.com/graveyard.jpg",
    category: "graveyard",
    regionType: "garden",
  },
  graveyard_fence: {
    id: "graveyard_fence",
    name: "Graveyard with Fence",
    prompt:
      "Create a classic graveyard scene with decorative fencing. Install black or gray plastic/metal graveyard fencing (2-3 feet tall with pointed posts and chain/bar details) to section off a small area of the front yard (approximately 8x8 feet). Inside the fenced area, place 4-6 tombstones (2-3 feet tall) with weathered stone appearance, various epitaphs, and aged details. Add skeletal remains, crows, and ground fog for atmosphere. Position a decorative entrance gate (slightly ajar for spooky effect) at the front. The fencing should look like old wrought iron with gothic details. Include dim lighting (purple, blue, or green) for nighttime visibility. This should create a contained cemetery scene while keeping all existing house structure, landscaping, trees, and overall yard features completely unchanged.",
    referenceImageUrl: "https://mycdn.com/graveyard-fence.jpg",
    category: "graveyard",
    regionType: "garden",
  },

  // Atmosphere / Spooky Mode
  really_spooky: {
    id: "really_spooky",
    name: "Really Spooky Mode",
    prompt:
      "CRITICAL ATMOSPHERIC TRANSFORMATION: Transform the entire scene into a dark, spooky Halloween night atmosphere. Change the time to nighttime with a dark twilight or midnight blue-black sky. Add a large full moon or blood moon (orange-red tinted) visible in the sky, partially obscured by wispy dark clouds. Add atmospheric ground fog (1-2 feet thick) rolling across the lawn and around landscaping. Change all lighting to dramatic Halloween lighting: warm orange glow from windows, purple and green accent lights on the house exterior, eerie blue-white uplighting on trees. Add volumetric fog/mist effects throughout the scene for mystery and depth. Darken all shadows dramatically and add rim lighting on edges of structures. The grass should appear darker, almost black-green in the moonlight. Create dramatic contrast between dark shadows and illuminated areas. Add subtle light rays from the moon breaking through clouds. The overall mood should be genuinely spooky and atmospheric - like a scene from a Halloween movie. Transform the lighting and atmosphere completely while keeping all existing house structure, landscaping, trees, plants, decorations, and physical yard features in their exact positions unchanged. Only modify lighting, time of day, sky, fog, and atmospheric effects.",
    referenceImageUrl: "https://mycdn.com/spooky-atmosphere.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
  spooky_lighting: {
    id: "spooky_lighting",
    name: "Spooky Lighting",
    prompt:
      "Add dramatic Halloween lighting effects to enhance the spooky atmosphere. Install orange, purple, green, and blue uplighting aimed at the house exterior, trees, and key features. Add warm orange glow emanating from all windows as if lit from within. Place purple or green spotlights creating dramatic shadows and highlighting decorations. Add string lights in orange and purple colors along the roofline or porch. Include flickering light effects to simulate candles or torches. Create colored light wash on the house facade (purple on one side, orange on another). The lighting should be theatrical and dramatic, creating a spooky but festive Halloween atmosphere. Keep all existing house structure, landscaping, decorations, and yard features completely unchanged - only add lighting effects.",
    referenceImageUrl: "https://mycdn.com/spooky-lighting.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
  fog_and_mist: {
    id: "fog_and_mist",
    name: "Fog and Mist",
    prompt:
      "Add atmospheric fog and mist effects throughout the scene. Create low-lying ground fog (1-2 feet thick) that rolls across the lawn, around landscaping beds, and across walkways. Add wispy mist effects around trees, near the house foundation, and floating through the air. The fog should be white to pale gray, creating a mysterious atmosphere. Make it denser in some areas (particularly around graveyard scenes or dark corners) and lighter in others. Add subtle volumetric fog effects catching light from any decorative lighting. The fog should enhance the spooky ambiance without completely obscuring decorations or house features. Keep all existing house structure, landscaping, decorations, and yard layout exactly unchanged - only add fog and mist atmospheric effects.",
    referenceImageUrl: "https://mycdn.com/fog-mist.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
};

export function getAllHalloweenStyles(): HalloweenStyleConfig[] {
  return Object.values(HALLOWEEN_STYLE_CONFIG);
}

export function getHalloweenStylesByCategory(
  category: HalloweenStyleConfig["category"],
): HalloweenStyleConfig[] {
  return Object.values(HALLOWEEN_STYLE_CONFIG).filter(
    (style) => style.category === category,
  );
}

export function getHalloweenStyleConfig(
  id: string,
): HalloweenStyleConfig | undefined {
  return HALLOWEEN_STYLE_CONFIG[id];
}
