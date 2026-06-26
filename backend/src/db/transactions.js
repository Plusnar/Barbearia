export const beginTransaction = (connection) => new Promise((resolve, reject) => {
  connection.beginTransaction((err) => (err ? reject(err) : resolve()));
});

export const commitTransaction = (connection) => new Promise((resolve, reject) => {
  connection.commit((err) => (err ? reject(err) : resolve()));
});

export const rollbackTransaction = (connection) => new Promise((resolve) => {
  connection.rollback(() => resolve());
});
