###############################
# Run script for Wayland-Cage #
###############################

# Rebuild bootstrap to ensure it is up-to-date
# At this time, bootstrap is just a dozen LOC
cargo build --release --bin bootstrap

# Run bootstrap with cage
cage ./target/release/bootstrap