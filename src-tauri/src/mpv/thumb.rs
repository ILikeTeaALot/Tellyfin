use libmpv2::Mpv;

fn vo_tone_mapping(mpv: &Mpv) -> Option<bool> {
	let count = mpv.get_property::<i64>("vo-passes/fresh/count").map(|v| v as usize).ok();
	match count {
		Some(count) => {
			for i in 0..count {
				if let Some(desc) = mpv.get_property::<String>(&format!("vo-passes/fresh/{}/desc", i)).ok() {
					let tone_mapping = desc.contains("tone map");
					// if desc.matches("tone map").collect::<Vec<_>>().len() > 0 {
					if tone_mapping {
						return Some(tone_mapping);
					}
				}
			}
			None
		},
		None => None
	}
}