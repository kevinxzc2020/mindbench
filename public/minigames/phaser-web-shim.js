(() => {
  if (!window.URL || typeof window.URL.createObjectURL !== 'function') return;

  const nativeCreateObjectURL = window.URL.createObjectURL.bind(window.URL);

  window.URL.createObjectURL = (value) => {
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      const buffer = value instanceof ArrayBuffer
        ? value
        : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      return nativeCreateObjectURL(new Blob([buffer], { type: 'image/png' }));
    }
    return nativeCreateObjectURL(value);
  };
})();
