async function checkProxy() {
  try {
    const response = await fetch('http://localhost:3000/api/proxy/formularios');
    const text = await response.text();
    console.log(text.substring(0, 1000)); // Log first 1000 chars
  } catch (e) {
    console.error(e);
  }
}
checkProxy();
