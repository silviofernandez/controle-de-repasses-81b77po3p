migrate(
  (app) => {
    app
      .db()
      .newQuery(
        "UPDATE users SET role = 'gestor' WHERE role IS NULL OR role = '' OR (role != 'gestor' AND role != 'investidor')",
      )
      .execute()
  },
  (app) => {},
)
