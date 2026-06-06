export type InteriorService =
  | "painting"
  | "bathroom"
  | "kitchen"
  | "living_room";

export interface InteriorStyleConfig {
  id: string;
  name: string;
  prompt: string;
}

export const INTERIOR_STYLE_CONFIG: Record<
  InteriorService,
  Record<string, InteriorStyleConfig>
> = {
  painting: {
    warm_neutral: {
      id: "warm_neutral",
      name: "Warm Neutral",
      prompt:
        "Repaint only the interior walls with a warm neutral designer paint palette: soft greige walls, crisp white trim, and a refined matte finish. Preserve furniture, flooring, windows, lighting fixtures, decor, layout, and room architecture exactly as shown.",
    },
    modern_white: {
      id: "modern_white",
      name: "Modern White",
      prompt:
        "Repaint only the interior walls with a clean modern white palette, subtle warm undertones, and crisp professional edges. Preserve all furniture, flooring, windows, trim placement, fixtures, decor, and room layout exactly as shown.",
    },
    moody_accent: {
      id: "moody_accent",
      name: "Moody Accent",
      prompt:
        "Repaint the room with a sophisticated moody accent wall in deep blue-green or charcoal and balanced light neutral surrounding walls. Keep all furniture, floors, windows, trim, fixtures, and decor unchanged.",
    },
    soft_color: {
      id: "soft_color",
      name: "Soft Color",
      prompt:
        "Repaint only the walls with a soft inviting color palette such as muted sage, dusty blue, or gentle clay depending on what fits the room. Preserve the room layout, furniture, trim, windows, flooring, lighting, and decor exactly as shown.",
    },
    pure_white: {
      id: "pure_white",
      name: "Pure White",
      prompt:
        "Repaint only the interior walls with a pure clean white paint color, using a smooth matte or eggshell finish and crisp edges at trim and ceiling lines. Preserve furniture, flooring, windows, lighting, decor, layout, and architecture exactly as shown.",
    },
    warm_white: {
      id: "warm_white",
      name: "Warm White",
      prompt:
        "Repaint only the walls with a warm white paint color that has a soft creamy undertone. Keep trim crisp, professional, and realistic. Preserve all furniture, floors, fixtures, windows, and room layout unchanged.",
    },
    soft_greige: {
      id: "soft_greige",
      name: "Soft Greige",
      prompt:
        "Repaint only the walls with a soft greige paint color, balanced between warm beige and light gray. Preserve all furnishings, flooring, windows, trim placement, fixtures, and decor exactly as shown.",
    },
    classic_beige: {
      id: "classic_beige",
      name: "Classic Beige",
      prompt:
        "Repaint only the walls with a classic beige paint color that feels warm, residential, and timeless. Preserve furniture, flooring, trim, windows, lighting, decor, and room architecture.",
    },
    light_taupe: {
      id: "light_taupe",
      name: "Light Taupe",
      prompt:
        "Repaint only the walls with a light taupe paint color, neutral and refined with subtle warmth. Keep all room contents, trim, floors, windows, lighting, and perspective unchanged.",
    },
    sage_green: {
      id: "sage_green",
      name: "Sage Green",
      prompt:
        "Repaint only the walls with a muted sage green paint color, soft and natural without oversaturation. Preserve all furniture, floor materials, trim, windows, lighting, and decor exactly as shown.",
    },
    olive_green: {
      id: "olive_green",
      name: "Olive Green",
      prompt:
        "Repaint only the walls with a tasteful olive green paint color, earthy and sophisticated. Preserve furniture, floors, trim, windows, fixtures, decor, and the existing room layout.",
    },
    dusty_blue: {
      id: "dusty_blue",
      name: "Dusty Blue",
      prompt:
        "Repaint only the walls with a muted dusty blue paint color, calm and refined. Preserve all furniture, flooring, trim, windows, lighting fixtures, decor, and camera perspective.",
    },
    slate_blue: {
      id: "slate_blue",
      name: "Slate Blue",
      prompt:
        "Repaint only the walls with a medium slate blue paint color with gray undertones. Keep the room layout, furniture, flooring, windows, trim, fixtures, and decor unchanged.",
    },
    navy_accent: {
      id: "navy_accent",
      name: "Navy Accent",
      prompt:
        "Repaint one appropriate focal wall in a deep navy blue accent color and keep surrounding walls a balanced light neutral. Preserve all furniture, floors, windows, trim, fixtures, and decor unchanged.",
    },
    charcoal_accent: {
      id: "charcoal_accent",
      name: "Charcoal Accent",
      prompt:
        "Repaint one appropriate focal wall in a rich charcoal gray accent color and keep surrounding walls a complementary light neutral. Preserve furniture, floors, windows, lighting, trim, and decor.",
    },
    terracotta: {
      id: "terracotta",
      name: "Terracotta",
      prompt:
        "Repaint only the walls with a muted terracotta clay paint color, warm and designer-friendly without becoming too orange. Preserve furniture, flooring, trim, windows, lighting, and decor.",
    },
    soft_blush: {
      id: "soft_blush",
      name: "Soft Blush",
      prompt:
        "Repaint only the walls with a soft blush paint color, subtle and muted rather than bright pink. Preserve room layout, furniture, flooring, windows, trim, fixtures, and decor.",
    },
    muted_mauve: {
      id: "muted_mauve",
      name: "Muted Mauve",
      prompt:
        "Repaint only the walls with a muted mauve paint color, soft, mature, and balanced. Preserve furniture, floors, windows, trim, lighting, decor, and architecture exactly as shown.",
    },
    buttercream: {
      id: "buttercream",
      name: "Buttercream",
      prompt:
        "Repaint only the walls with a soft buttercream paint color, warm and bright with a gentle yellow undertone. Preserve all room contents, trim, flooring, windows, fixtures, and decor.",
    },
    custom_paint_color: {
      id: "custom_paint_color",
      name: "Custom Paint Color",
      prompt:
        "Repaint only the walls with the exact custom paint color specified by the user. Keep the finish realistic and professional with clean edges at trim, ceiling, windows, and doors. Preserve furniture, floors, fixtures, decor, and room architecture exactly as shown.",
    },
  },
  bathroom: {
    modern_spa: {
      id: "modern_spa",
      name: "Modern Spa",
      prompt:
        "Redesign this bathroom into a modern spa-inspired space with clean large-format tile, warm wood or white oak vanity details, refined lighting, simple premium fixtures, and a calm neutral palette. Preserve the room footprint, camera angle, window and door locations, and plumbing fixture locations unless a visual upgrade is needed in the same position.",
    },
    luxury_marble: {
      id: "luxury_marble",
      name: "Luxury Marble",
      prompt:
        "Redesign this bathroom with luxury marble-look surfaces, polished chrome or brushed nickel fixtures, elegant vanity styling, upscale lighting, and a bright high-end hotel feel. Keep the same room footprint, window and door locations, camera angle, and major fixture positions.",
    },
    warm_traditional: {
      id: "warm_traditional",
      name: "Warm Traditional",
      prompt:
        "Redesign this bathroom with a warm traditional style: soft neutral tile, classic vanity profile, tasteful hardware, upgraded mirror and lighting, and timeless finishes. Preserve the existing layout, perspective, walls, door and window placement.",
    },
    compact_refresh: {
      id: "compact_refresh",
      name: "Compact Refresh",
      prompt:
        "Refresh this bathroom with space-efficient modern finishes, brighter surfaces, streamlined storage, clean fixtures, and a polished practical layout. Preserve the room footprint, camera perspective, door and window positions, and major plumbing locations.",
    },
  },
  kitchen: {
    modern_white: {
      id: "modern_white",
      name: "Modern White",
      prompt:
        "Redesign this kitchen with modern white cabinetry, bright stone countertops, clean backsplash, updated hardware, integrated lighting, and a polished contemporary finish. Preserve the room footprint, window and door locations, camera angle, and appliance positions where possible.",
    },
    warm_wood: {
      id: "warm_wood",
      name: "Warm Wood",
      prompt:
        "Redesign this kitchen with warm wood cabinetry, durable light countertops, subtle tile backsplash, refined hardware, and inviting natural textures. Maintain the existing layout, room architecture, window and door placement, and perspective.",
    },
    two_tone: {
      id: "two_tone",
      name: "Two-Tone",
      prompt:
        "Redesign this kitchen with a tasteful two-tone cabinet scheme, balanced light and dark finishes, upgraded counters, modern backsplash, and coordinated fixtures. Preserve the original room footprint, appliance zones, windows, doors, and camera angle.",
    },
    luxury_stone: {
      id: "luxury_stone",
      name: "Luxury Stone",
      prompt:
        "Redesign this kitchen with high-end stone countertops, refined cabinetry, premium backsplash, elevated lighting, and a polished luxury remodel aesthetic. Keep the layout, walls, window and door locations, and camera perspective consistent.",
    },
    cabinets_white_shaker: {
      id: "cabinets_white_shaker",
      name: "White Shaker Cabinets",
      prompt:
        "Replace only the kitchen cabinets with clean white shaker-style cabinetry and coordinated simple hardware. Preserve existing countertops, sink, backsplash, appliances, flooring, walls, windows, and overall layout unless another selected option explicitly changes them.",
    },
    cabinets_warm_oak: {
      id: "cabinets_warm_oak",
      name: "Warm Oak Cabinets",
      prompt:
        "Replace only the kitchen cabinets with warm natural oak cabinetry, realistic wood grain, and refined modern hardware. Preserve counters, sink, backsplash, appliances, floor, walls, windows, and layout unless another selected option changes them.",
    },
    cabinets_sage_green: {
      id: "cabinets_sage_green",
      name: "Sage Green Cabinets",
      prompt:
        "Replace only the kitchen cabinets with muted sage green painted cabinetry and tasteful hardware. Preserve countertops, sink, backsplash, appliances, flooring, windows, walls, and layout unless another selected option changes them.",
    },
    cabinets_navy_lower: {
      id: "cabinets_navy_lower",
      name: "Navy Lower Cabinets",
      prompt:
        "Update only the lower kitchen cabinets or island cabinetry to a deep navy blue finish while keeping upper cabinets light and balanced. Preserve counters, sink, backsplash, appliances, flooring, windows, and layout unless another selected option changes them.",
    },
    cabinets_black_modern: {
      id: "cabinets_black_modern",
      name: "Modern Black Cabinets",
      prompt:
        "Replace only the kitchen cabinets with sleek modern black cabinetry and minimal hardware. Preserve countertops, sink, backsplash, appliances, flooring, windows, walls, and layout unless another selected option changes them.",
    },
    counters_white_quartz: {
      id: "counters_white_quartz",
      name: "White Quartz Counters",
      prompt:
        "Replace only the countertops with bright white quartz counters with subtle veining and realistic thickness. Preserve cabinets, sink position, backsplash, appliances, flooring, walls, windows, and layout unless another selected option changes them.",
    },
    counters_marble: {
      id: "counters_marble",
      name: "Marble-Look Counters",
      prompt:
        "Replace only the countertops with elegant marble-look stone featuring soft natural veining. Preserve cabinets, sink position, backsplash, appliances, flooring, windows, and room layout unless another selected option changes them.",
    },
    counters_dark_stone: {
      id: "counters_dark_stone",
      name: "Dark Stone Counters",
      prompt:
        "Replace only the countertops with dark stone counters such as honed granite or soapstone, realistic and professionally installed. Preserve cabinets, sink position, backsplash, appliances, floors, windows, and layout unless another selected option changes them.",
    },
    counters_butcher_block: {
      id: "counters_butcher_block",
      name: "Butcher Block Counters",
      prompt:
        "Replace only the countertops with warm butcher block wood counters, realistic grain and thickness. Preserve cabinets, sink position, backsplash, appliances, flooring, walls, windows, and layout unless another selected option changes them.",
    },
    sink_farmhouse: {
      id: "sink_farmhouse",
      name: "Farmhouse Sink",
      prompt:
        "Replace only the kitchen sink with a white apron-front farmhouse sink and coordinated faucet, keeping it in the existing sink area. Preserve cabinets, counters, backsplash, appliances, floors, and layout unless another selected option changes them.",
    },
    sink_undermount: {
      id: "sink_undermount",
      name: "Undermount Sink",
      prompt:
        "Replace only the kitchen sink with a sleek stainless undermount sink and modern faucet in the existing sink area. Preserve cabinets, counters, backsplash, appliances, flooring, and layout unless another selected option changes them.",
    },
    sink_black_workstation: {
      id: "sink_black_workstation",
      name: "Black Workstation Sink",
      prompt:
        "Replace only the kitchen sink with a matte black workstation sink and matching modern faucet in the existing sink area. Preserve cabinetry, counters, backsplash, appliances, flooring, windows, and layout unless another selected option changes them.",
    },
    backsplash_subway: {
      id: "backsplash_subway",
      name: "Subway Tile Backsplash",
      prompt:
        "Replace only the backsplash with clean white subway tile and realistic grout lines. Preserve cabinets, countertops, sink, appliances, flooring, walls, windows, and layout unless another selected option changes them.",
    },
    backsplash_zellige: {
      id: "backsplash_zellige",
      name: "Zellige Tile Backsplash",
      prompt:
        "Replace only the backsplash with handmade zellige-style tile with subtle color variation and glossy texture. Preserve cabinets, counters, sink, appliances, floor, windows, and layout unless another selected option changes them.",
    },
    pendant_lighting: {
      id: "pendant_lighting",
      name: "Pendant Lighting",
      prompt:
        "Add or replace only visible kitchen lighting with tasteful pendant lights or modern ceiling fixtures appropriate to the room. Preserve cabinets, counters, sink, backsplash, appliances, flooring, windows, and layout unless another selected option changes them.",
    },
    hardware_brass: {
      id: "hardware_brass",
      name: "Brass Hardware",
      prompt:
        "Update only cabinet hardware and visible fixtures to warm brass or champagne bronze finishes. Preserve cabinetry color, countertops, sink, backsplash, appliances, flooring, windows, and layout unless another selected option changes them.",
    },
    full_kitchen_refresh: {
      id: "full_kitchen_refresh",
      name: "Cabinets + Counter + Sink",
      prompt:
        "Refresh the kitchen with coordinated new cabinets, new countertops, and a new sink/faucet together. Choose a balanced combination that fits the existing room, while preserving the kitchen footprint, appliance zones, windows, doors, camera angle, and practical layout.",
    },
  },
  living_room: {
    modern_cozy: {
      id: "modern_cozy",
      name: "Modern Cozy",
      prompt:
        "Redesign this living room with a modern cozy style: balanced furniture arrangement, layered textiles, warm neutral palette, tasteful lighting, and refined decor. Preserve the room architecture, windows, doors, flooring footprint, and camera perspective.",
    },
    scandinavian: {
      id: "scandinavian",
      name: "Scandinavian",
      prompt:
        "Redesign this living room with a Scandinavian-inspired look: light woods, soft neutral upholstery, simple functional furniture, clean lines, natural textures, and bright airy styling. Keep windows, doors, walls, flooring footprint, and camera angle consistent.",
    },
    classic_comfort: {
      id: "classic_comfort",
      name: "Classic Comfort",
      prompt:
        "Redesign this living room with classic comfortable furnishings, coordinated rugs and decor, warm layered lighting, tasteful art, and a timeless residential feel. Preserve the existing architecture, windows, doorways, perspective, and room footprint.",
    },
    luxe_contemporary: {
      id: "luxe_contemporary",
      name: "Luxe Contemporary",
      prompt:
        "Redesign this living room with a luxe contemporary style: elevated furniture, statement lighting, refined textures, balanced decor, and a polished designer look. Preserve the architecture, window and door placement, flooring footprint, and camera view.",
    },
    couch_linen_sectional: {
      id: "couch_linen_sectional",
      name: "Linen Sectional Sofa",
      prompt:
        "Replace only the main couch or sofa with a light linen sectional sofa sized naturally for the room. Preserve walls, windows, flooring, lighting, other furniture, decor, and camera perspective unless another selected option changes them.",
    },
    couch_leather: {
      id: "couch_leather",
      name: "Leather Sofa",
      prompt:
        "Replace only the main couch or sofa with a warm cognac leather sofa that fits the room scale. Preserve walls, windows, flooring, lighting, other furniture, decor, and layout unless another selected option changes them.",
    },
    couch_modern_curved: {
      id: "couch_modern_curved",
      name: "Modern Curved Sofa",
      prompt:
        "Replace only the main couch or sofa with a modern curved sofa in a neutral fabric, scaled realistically for the room. Preserve windows, walls, flooring, other furniture, lighting, decor, and layout unless another selected option changes them.",
    },
    couch_blue_velvet: {
      id: "couch_blue_velvet",
      name: "Blue Velvet Sofa",
      prompt:
        "Replace only the main couch or sofa with a tasteful deep blue velvet sofa that fits the room. Preserve architecture, flooring, windows, lighting, other furniture, decor, and perspective unless another selected option changes them.",
    },
    accent_chairs: {
      id: "accent_chairs",
      name: "Accent Chairs",
      prompt:
        "Add or update only accent chairs with coordinated designer chairs that fit the room scale and circulation. Preserve the main architecture, flooring, windows, couch, lighting, decor, and layout unless another selected option changes them.",
    },
    area_rug: {
      id: "area_rug",
      name: "Area Rug",
      prompt:
        "Add or replace only the area rug with a well-sized designer rug that anchors the living room seating area. Preserve flooring, walls, windows, furniture placement, lighting, and decor unless another selected option changes them.",
    },
    media_wall: {
      id: "media_wall",
      name: "Media Wall",
      prompt:
        "Redesign only the TV or media wall with a clean built-in or panelled media feature appropriate to the room. Preserve windows, flooring, seating, lighting, other walls, and camera perspective unless another selected option changes them.",
    },
    fireplace_refresh: {
      id: "fireplace_refresh",
      name: "Fireplace Refresh",
      prompt:
        "Refresh only the fireplace area with updated surround material, mantel styling, or tasteful built-in detail. Preserve windows, walls outside the fireplace area, flooring, furniture, lighting, and camera perspective unless another selected option changes them.",
    },
    built_in_shelving: {
      id: "built_in_shelving",
      name: "Built-In Shelving",
      prompt:
        "Add or update built-in shelving where it naturally fits the living room, realistic and proportional. Preserve windows, doors, flooring, main furniture, lighting, and overall room footprint unless another selected option changes them.",
    },
    lighting_refresh: {
      id: "lighting_refresh",
      name: "Lighting Refresh",
      prompt:
        "Update only the visible living room lighting with tasteful ceiling, floor, or table lighting that fits the room. Preserve furniture, flooring, walls, windows, decor, and layout unless another selected option changes them.",
    },
    curtains_window_treatments: {
      id: "curtains_window_treatments",
      name: "Curtains",
      prompt:
        "Add or replace only curtains and window treatments with tailored fabric panels or shades that fit the room style. Preserve windows, walls, flooring, furniture, lighting, decor, and layout unless another selected option changes them.",
    },
    coffee_table_refresh: {
      id: "coffee_table_refresh",
      name: "Coffee Table",
      prompt:
        "Replace only the coffee table with a tasteful designer coffee table scaled correctly for the seating area. Preserve couch, chairs, rug, walls, windows, flooring, lighting, and decor unless another selected option changes them.",
    },
  },
};

export function getInteriorStyleConfig(
  service: InteriorService,
  styleId: string,
): InteriorStyleConfig {
  const serviceConfig = INTERIOR_STYLE_CONFIG[service];
  if (!serviceConfig) {
    throw new Error(`Unknown interior service: ${service}`);
  }

  const styleConfig = serviceConfig[styleId];
  if (!styleConfig && styleId.startsWith("tenant_custom_")) {
    const name = styleId
      .replace(/^tenant_custom_/, "")
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      id: styleId,
      name: name || "Client Custom Option",
      prompt:
        "Apply the client-specific custom remodel option selected for this embed. Follow any additional client-specific instructions provided separately, keep the result realistic and buildable, and preserve the original room layout unless the selected option requires a same-position finish upgrade.",
    };
  }

  if (!styleConfig) {
    throw new Error(`Unknown ${service} style: ${styleId}`);
  }

  return styleConfig;
}
