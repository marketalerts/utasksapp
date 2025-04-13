export function supportsDialog() {
  try {
    document.createElement('dialog').close();

    return true;
  } catch (e) {
    return false;
  }
}
