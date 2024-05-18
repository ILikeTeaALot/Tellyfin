use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[repr(transparent)]
pub struct JellyfinId(String);

impl From<String> for JellyfinId {
	fn from(value: String) -> Self {
		JellyfinId(value)
	}
}