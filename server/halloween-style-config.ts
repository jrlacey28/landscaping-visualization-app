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

  // Giant Skeleton
  giant_skeleton: {
    id: "giant_skeleton",
    name: "Giant Skeleton",
    prompt:
      "Add a massive 12-foot tall giant skeleton decoration as the centerpiece of the Halloween display. Position this oversized skeleton standing prominently in the front yard - either reaching toward the house, waving at visitors, or in a dramatic pose. The skeleton should be white/bone-colored with realistic anatomical proportions scaled up massively. It should stand at least 12 feet tall (reaching roof height on single-story homes). Add LED lights in the eyes for a glowing effect. The giant skeleton should look impressive and eye-catching, becoming the main focal point of the display. Position it where it's highly visible from the street. Keep all existing house structure, landscaping, and yard features completely unchanged - only add this giant skeleton decoration.",
    referenceImageUrl: "https://mycdn.com/giant-skeleton.jpg",
    category: "skeletons",
    regionType: "outdoor",
  },

  // Inflatable Characters
  inflatable_giant_pumpkin: {
    id: "inflatable_giant_pumpkin",
    name: "Giant Pumpkin Inflatable",
    prompt:
      "Add a large inflatable jack-o'-lantern decoration in the front yard. Place an oversized inflatable pumpkin (6-8 feet tall and wide) with a carved smiling or spooky face, glowing from internal LED lights. The inflatable should be bright orange with a green stem on top, appearing round and plump. Position it prominently on the lawn where it's visible from the street. The inflatable should look festive and well-lit at night with warm orange glow. Include the slight wrinkles and seams typical of inflatable decorations for realism. Keep all existing house structure, landscaping, and yard features unchanged.",
    referenceImageUrl: "https://mycdn.com/inflatable-pumpkin.jpg",
    category: "inflatables",
    regionType: "outdoor",
  },
  inflatable_grim_reaper: {
    id: "inflatable_grim_reaper",
    name: "Grim Reaper Inflatable",
    prompt:
      "Add a tall inflatable Grim Reaper figure to the Halloween display. Place a 7-10 foot tall inflatable Grim Reaper with black hooded robe, skeletal face, and carrying a scythe. The figure should be illuminated from within with eerie lighting. Position it in a prominent spot in the yard, appearing to loom over the property. The reaper should have a menacing but family-friendly appearance with glowing eyes or face. The inflatable should have realistic fabric texture of the robe with slight wrinkles. Keep all existing house structure, landscaping, and yard features exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/inflatable-reaper.jpg",
    category: "inflatables",
    regionType: "outdoor",
  },
  inflatable_haunted_tree: {
    id: "inflatable_haunted_tree",
    name: "Haunted Tree Inflatable",
    prompt:
      "Add a spooky inflatable haunted tree decoration to the yard. Place a 7-9 foot tall inflatable dead tree with gnarled twisted branches, carved scary face on the trunk, and eerie lighting. The tree should be dark brown/black with gnarly texture, bare twisted branches reaching out, and a menacing face carved or formed in the trunk. Add glowing eyes or mouth lit from within. Position it in the yard where it creates a spooky focal point. The tree should look ancient and haunted with weathered bark texture. Keep all existing house structure, real trees, landscaping, and yard features completely preserved.",
    referenceImageUrl: "https://mycdn.com/inflatable-tree.jpg",
    category: "inflatables",
    regionType: "outdoor",
  },

  // Animated Props
  animated_heads: {
    id: "animated_heads",
    name: "Animated Talking Heads",
    prompt:
      "Add animated talking head props to the Halloween display. Place 2-3 disembodied animated heads (12-16 inches tall) positioned on fence posts, porch railings, or stakes in the yard. The heads should appear to be talking, singing, or moving with mechanical animation - mouths opening and closing, eyes moving, heads turning side to side. Make them look like severed zombie or monster heads with detailed facial features, realistic skin texture, and eerie expressions. Add subtle lighting on each head. They should look like they're interacting with visitors. Keep all existing house structure, landscaping, and yard features unchanged.",
    referenceImageUrl: "https://mycdn.com/animated-heads.jpg",
    category: "animated",
    regionType: "outdoor",
  },
  animated_talking_pumpkin: {
    id: "animated_talking_pumpkin",
    name: "Talking Pumpkin",
    prompt:
      "Add an animated talking jack-o'-lantern prop to the display. Place a medium to large carved pumpkin (14-18 inches diameter) with an animated projected face that talks, sings, or tells jokes. The pumpkin should have a traditional orange appearance with the face projection showing expressive eyes and mouth that move realistically as if speaking. Add warm internal glow. Position it on the porch, steps, or prominent location where visitors can see and hear it. The face projection should look like it's carved into the pumpkin with realistic lighting effects. Keep all existing house structure, landscaping, and yard features exactly preserved.",
    referenceImageUrl: "https://mycdn.com/talking-pumpkin.jpg",
    category: "animated",
    regionType: "outdoor",
  },
  animated_jumping_spider: {
    id: "animated_jumping_spider",
    name: "Jumping Spider",
    prompt:
      "Add an animated jumping spider prop that drops down to startle visitors. Install a large black spider (2-3 feet leg span) suspended above the walkway or porch entrance with a drop-down mechanism. The spider should appear to be hanging on a web strand, ready to drop down when activated. Show it in either the raised position or mid-drop. The spider should be black with detailed hairy legs, realistic body segments, and glowing red eyes. Include visible web strand or cable it hangs from. Position it where it would surprise people approaching the entrance. Keep all existing house structure, landscaping, and yard features unchanged.",
    referenceImageUrl: "https://mycdn.com/jumping-spider.jpg",
    category: "animated",
    regionType: "outdoor",
  },

  // Haunted Pathway Lights
  skull_torch_lights: {
    id: "skull_torch_lights",
    name: "LED Skull Torches",
    prompt:
      "Add LED skull torch pathway lights leading to the entrance. Place 6-10 illuminated skull torches (18-24 inches tall) lining both sides of the walkway, spaced evenly every 3-4 feet. Each torch should be a realistic white/gray skull on a stake with flickering LED flame effect emanating from the top. The skulls should have detailed bone texture and hollow eye sockets. The flame effect should glow orange/red with realistic flickering. They should create an eerie but festive pathway to the door. Position them along the walkway or driveway edges for maximum effect. Keep all existing house structure, landscaping, walkways, and yard features exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/skull-torches.jpg",
    category: "lights",
    regionType: "outdoor",
  },
  flickering_lanterns: {
    id: "flickering_lanterns",
    name: "Flickering Lanterns",
    prompt:
      "Add antique-style flickering lanterns throughout the Halloween display. Place 5-8 old-fashioned lanterns (12-16 inches tall) on the porch, steps, along walkway, or hanging from shepherd's hooks in the yard. Each lantern should be black metal with glass panels showing flickering LED candlelight or flame effect inside. The flickering should create an eerie, haunted atmosphere. Mix placement styles: some sitting on surfaces, some hanging from hooks or tree branches, some along the pathway. The lanterns should look aged and weathered with vintage metal finish. Keep all existing house structure, landscaping, and yard features completely preserved.",
    referenceImageUrl: "https://mycdn.com/flickering-lanterns.jpg",
    category: "lights",
    regionType: "outdoor",
  },

  // Clowns
  creepy_carnival_clowns: {
    id: "creepy_carnival_clowns",
    name: "Creepy Carnival Clowns",
    prompt:
      "Add unsettling circus clown decorations to create a creepy carnival atmosphere. Place 2-4 life-sized (5-6 feet tall) clown figures with distorted faces, exaggerated makeup, and unnerving grins positioned around the yard. The clowns should wear traditional circus costumes (ruffled collars, colorful but faded outfits, oversized shoes) but with a sinister twist - cracked makeup, hollow eyes, disturbing smiles. Add vintage circus props like weathered signs or carnival bunting. Position them in unexpected spots - peeking around corners, standing in shadows, or clustered together. They should be creepy but not extremely gory. Keep all existing house structure, landscaping, and yard features unchanged.",
    referenceImageUrl: "https://mycdn.com/creepy-clowns.jpg",
    category: "clowns",
    regionType: "outdoor",
  },
  circus_tent_display: {
    id: "circus_tent_display",
    name: "Haunted Circus Tent",
    prompt:
      "Create a miniature haunted circus tent display in the front yard. Set up a small striped circus tent (6-8 feet wide, 6-7 feet tall) with red and white or black and white weathered stripes. Add creepy carnival elements around it: distorted clown figures, vintage circus posters, aged carnival props, and eerie lighting (purple, red, or flickering). The tent should look abandoned and haunted with tattered fabric and faded colors. Position circus clown decorations near the entrance. Add ground fog for atmosphere. This should evoke an unsettling abandoned carnival feel. Keep all existing house structure, landscaping, and yard features exactly preserved.",
    referenceImageUrl: "https://mycdn.com/circus-tent.jpg",
    category: "clowns",
    regionType: "garden",
  },

  // Zombies
  groundbreaker_zombies: {
    id: "groundbreaker_zombies",
    name: "Groundbreaker Zombies",
    prompt:
      "Add groundbreaker zombie decorations emerging from the lawn. Place 3-5 zombie figures appearing to crawl out from underground, with upper bodies, heads, and arms visible above ground level. The zombies should have decayed flesh appearance, tattered clothing, reaching arms, and distressed expressions. Position them throughout the lawn as if breaking through the earth's surface. Some should be reaching forward, others clawing at the ground. Add disturbed dirt or grass effects around them. The zombies should look realistic with detailed decay makeup and weathered clothes, but keep it family-friendly (no extreme gore). Preserve all existing house structure, landscaping, trees, and yard features unchanged.",
    referenceImageUrl: "https://mycdn.com/groundbreaker-zombies.jpg",
    category: "zombies",
    regionType: "garden",
  },
  zombie_horde: {
    id: "zombie_horde",
    name: "Zombie Horde",
    prompt:
      "Create a zombie horde scene with multiple undead figures shambling across the yard. Place 5-7 life-sized zombie figures (5-6 feet tall) positioned throughout the front yard in various walking/lurching poses, appearing to approach the house. Each zombie should have unique characteristics: tattered clothing, decayed appearance, reaching arms, distressed faces. Arrange them in a group formation moving from one side toward the entrance. Add eerie green or blue lighting on the figures. The zombies should look authentically undead with detailed makeup and costumes but remain appropriate for families. Keep all existing house structure, landscaping, and yard features exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/zombie-horde.jpg",
    category: "zombies",
    regionType: "outdoor",
  },

  // Mummies
  wrapped_mummy_figures: {
    id: "wrapped_mummy_figures",
    name: "Wrapped Mummies",
    prompt:
      "Add ancient Egyptian mummy decorations wrapped in weathered bandages. Place 2-3 life-sized mummy figures (5-6 feet tall) wrapped in aged, tattered linen bandages with arms outstretched or crossed. The mummies should have visible bandage wrapping texture with some strips hanging loose. Add glowing eyes visible through bandage gaps. Position them standing near the entrance, emerging from behind bushes, or on the porch. The bandages should look ancient and yellowed with some brown aging stains. They should evoke the classic movie mummy appearance. Keep all existing house structure, landscaping, and yard features completely preserved.",
    referenceImageUrl: "https://mycdn.com/mummies.jpg",
    category: "mummies",
    regionType: "outdoor",
  },
  mummy_tomb_display: {
    id: "mummy_tomb_display",
    name: "Mummy Tomb Display",
    prompt:
      "Create an Egyptian tomb scene with mummy sarcophagus and mummies. Place a decorative Egyptian sarcophagus (6-7 feet tall) standing upright with ornate hieroglyphic designs and gold/turquoise colors. Position 1-2 wrapped mummy figures emerging from or standing beside the tomb. Add Egyptian themed props like faux stone columns, hieroglyphic panels, or burial urns. Include amber or golden lighting to create tomb atmosphere. The sarcophagus should have detailed ancient Egyptian artwork and the mummies should be wrapped in weathered bandages. This should look like an archaeological dig gone wrong. Keep all existing house structure, landscaping, and yard features exactly unchanged.",
    referenceImageUrl: "https://mycdn.com/mummy-tomb.jpg",
    category: "mummies",
    regionType: "garden",
  },

  // Vampires
  vampire_coffin_display: {
    id: "vampire_coffin_display",
    name: "Vampire Coffin",
    prompt:
      "Add a vampire coffin display with vampire figure rising from the grave. Place a black or dark wood coffin (6-7 feet long) positioned at an angle in the yard, lid partially open. Add a vampire figure (5-6 feet tall) emerging from or standing beside the coffin, wearing classic vampire attire: black cape with red lining, formal period clothing, pale face with fangs visible. The vampire should have dramatic pose with cape spread or arms reaching out. Add red accent lighting and possible ground fog. Include gothic details like ornate coffin handles and interior red velvet lining. Keep all existing house structure, landscaping, and yard features completely unchanged.",
    referenceImageUrl: "https://mycdn.com/vampire-coffin.jpg",
    category: "vampires",
    regionType: "garden",
  },
  vampire_silhouettes: {
    id: "vampire_silhouettes",
    name: "Vampire Silhouettes",
    prompt:
      "Add dramatic vampire silhouettes to create a gothic Dracula atmosphere. Place 2-4 vampire silhouettes (4-6 feet tall) as backlit window displays or yard stakes. Each silhouette should show classic vampire pose: cape spread in bat-wing shape, formal attire, dramatic stance. If in windows, backlight from inside with red or purple lighting. If yard stakes, use black metal cutouts with subtle backlighting. Position them to create dramatic shadows and imposing presence. The silhouettes should evoke classic Dracula imagery with pointed collars, flowing capes, and aristocratic poses. Keep all existing house structure, windows, landscaping, and yard features exactly preserved.",
    referenceImageUrl: "https://mycdn.com/vampire-silhouettes.jpg",
    category: "vampires",
    regionType: "outdoor",
  },

  // Atmosphere / Modes
  night_mode: {
    id: "night_mode",
    name: "Night Mode",
    prompt:
      "ATMOSPHERIC CONVERSION - NIGHT TIME ONLY: Convert the scene from daytime to nighttime to show how the decorations will look after dark. Change the sky to deep twilight blue or dark night with stars. Add a normal full moon (soft white/pale yellow) in the sky. Change the lighting to evening/night conditions: warm yellow glow from house windows, soft landscape lighting, porch lights on, street lights in background. Darken the overall scene appropriately for nighttime but keep it well-lit enough to see all decorations clearly. The grass should appear darker blue-green in moonlight. Make shadows deeper and more dramatic. This is a SIMPLE day-to-night conversion - do not add fog, colored lights, or dramatic effects. Keep the atmosphere natural and realistic for a regular night. CRITICAL: Keep all existing house structure, landscaping, trees, plants, Halloween decorations, and all physical features in their exact positions completely unchanged. Only modify time of day, sky, and natural nighttime lighting.",
    referenceImageUrl: "https://mycdn.com/night-mode.jpg",
    category: "atmosphere",
    regionType: "outdoor",
  },
  really_spooky: {
    id: "really_spooky",
    name: "Really Spooky Mode",
    prompt:
      "DRAMATIC SPOOKY ATMOSPHERE ENHANCEMENT: Transform the scene into a dramatically spooky Halloween night while preserving all decorations. Change to nighttime with dark midnight blue-black sky. Add a large blood moon (orange-red tinted) or dramatic full moon breaking through ominous dark clouds. Add thick atmospheric ground fog (1-2 feet deep) rolling across the lawn. Change lighting to dramatic Halloween effects: eerie orange glow from windows, purple and green accent lights on house exterior and decorations, blue-white uplighting on trees, theatrical colored spotlights. Add volumetric fog/mist effects throughout for mystery. Create stark dramatic shadows with rim lighting on structures. Make grass appear dark black-green in the eerie moonlight. Add subtle light rays from moon breaking through clouds. The atmosphere should feel like a Halloween movie scene - genuinely spooky and theatrical. CRITICAL: This is ONLY an atmospheric enhancement - keep ALL existing Halloween decorations that were already added, keep all house structure, landscaping, trees, plants, and all physical yard features in exact positions completely unchanged. This mode ENHANCES what's already there with spooky atmosphere, lighting, and fog - it does NOT replace or remove anything.",
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
