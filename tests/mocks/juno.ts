// Mock Juno for testing
export const mockJuno = {
  docs: new Map<string, any>(),
  
  setDoc: async ({ collection, doc }: any) => {
    const key = `${collection}:${doc.key}`;
    mockJuno.docs.set(key, doc.data);
    return doc;
  },
  
  getDoc: async ({ collection, key }: any) => {
    const docKey = `${collection}:${key}`;
    const data = mockJuno.docs.get(docKey);
    return data ? { key, data } : null;
  },
  
  listDocs: async ({ collection }: any) => {
    const items: any[] = [];
    mockJuno.docs.forEach((data, key) => {
      if (key.startsWith(`${collection}:`)) {
        items.push({ key: key.split(':')[1], data });
      }
    });
    return { items };
  },
  
  clear: () => {
    mockJuno.docs.clear();
  }
};

// Mock the @junobuild/core module
export const setupJunoMocks = () => {
  // @ts-ignore
  global.setDoc = mockJuno.setDoc;
  // @ts-ignore
  global.getDoc = mockJuno.getDoc;
  // @ts-ignore
  global.listDocs = mockJuno.listDocs;
};
