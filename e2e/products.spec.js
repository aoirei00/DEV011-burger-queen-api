const {
  fetch,
  fetchAsTestUser,
  fetchAsAdmin,
} = process;

describe('POST /products', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsTestUser('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(403))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should create product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'test2', price: 5, image: 'image-test.jpg', type: 'food' },
    })
      .then((resp) => {
        console.log('Response:', resp);
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json._id).toBe('string');
        expect(typeof json.name).toBe('string');
        expect(typeof json.price).toBe('number');
        expect(typeof json.image).toBe('string');
        expect(typeof json.type).toBe('string');
      })
  ));
});

describe('GET /products', () => {
  it('should get products with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json.totalItems).toBe('number');
        expect(typeof json.totalPages).toBe('number');
        expect(typeof json.currentPage).toBe('number');
        expect(Array.isArray(json.products)).toBe(true);
  
        json.products.forEach((product) => {
          expect(typeof product._id).toBe('string');
          expect(typeof product.name).toBe('string');
          expect(typeof product.price).toBe('number');
        });
      })
  ));
});

describe('GET /products/:productid', () => {
  it('should fail with 404 when not found', () => (
    fetchAsTestUser('/products/notarealproduct')
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should get product with Auth', () => (
    fetchAsTestUser('/products')
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        // Verifica que la respuesta tiene las propiedades correctas
        expect(typeof json.totalItems).toBe('number');
        expect(typeof json.totalPages).toBe('number');
        expect(typeof json.currentPage).toBe('number');
        expect(Array.isArray(json.products)).toBe(true);
  
        // Si hay productos en la respuesta, verifica cada producto
        if (json.products.length > 0) {
          json.products.forEach((product) => {
            expect(typeof product._id).toBe('string');
            expect(typeof product.name).toBe('string');
            expect(typeof product.price).toBe('number');
          });
        }
      })
  ));
});

describe('PUT /products/:productid', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products/xxx', { method: 'PUT' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'Test', price: 10, image: 'test.img', type: 'test type' },
    })
      .then((resp) => resp.json())
      .then((json) => fetchAsTestUser(`/products/${json._id}`, {
        method: 'PUT',
        body: { price: 20 },
      }))
      .then((resp) => resp.json())
      .then((json) => {
        expect(json.statusCode).toBe(403);
      })
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/products/12345678901234567890', {
      method: 'PUT',
      body: { price: 1 },
    })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'Test4', price: 10, image: 'test.img', type: 'test type' },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json._id}`, {
        method: 'PUT',
        body: { price: 'abc' },
      }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should update product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'Test5', price: 10, image: 'test.img', type: 'test type' },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/products/${json._id}`, {
        method: 'PUT',
        body: { price: 20 },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.price).toBe(20))
  ));
});

describe('DELETE /products/:productid', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/products/xxx', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 403 when not admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'Test6', price: 10, image: 'test.img', type: 'test type' },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser(`/products/${json._id}`, { method: 'DELETE' }))
      .then((resp) => expect(resp.status).toBe(403))
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/products/12345678901234567890', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should delete other product as admin', () => (
    fetchAsAdmin('/products', {
      method: 'POST',
      body: { name: 'Test9', price: 10, image: 'test.img', type: 'test type' },
    })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then(
        ({ _id }) => fetchAsAdmin(`/products/${_id}`, { method: 'DELETE' })
          .then((resp) => ({ resp, _id })),
      )
      .then(({ resp, _id }) => {
        expect(resp.status).toBe(200);
        return fetchAsAdmin(`/products/${_id}`);
      })
      .then((resp) => expect(resp.status).toBe(404))
  ));
});
