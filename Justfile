update-remotes:
  git submodule update --remote otium

build-wasm:
  nix-build -I nixpkgs=channel:nixpkgs-unstable otium/os -o result-wasm
  mkdir -p public/os-wasm
  chmod -f +w public/os-wasm/os.wasm public/os-wasm/os.js || true
  cat result-wasm/lib/os.wasm > public/os-wasm/os.wasm
  cat result-wasm/lib/os.js > public/os-wasm/os.js
  @echo "WASM files copied to public/os-wasm/"
