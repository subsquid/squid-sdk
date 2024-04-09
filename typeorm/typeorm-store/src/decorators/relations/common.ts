export interface RelationOptions {
    /**
     * Indicates if relation column value can be nullable or not.
     */
    nullable?: boolean
    /**
     * Indicates whether foreign key constraints will be created for join columns.
     * Can be used only for many-to-one and owner one-to-one relations.
     * Defaults to true.
     */
    createForeignKeyConstraints?: boolean
    /**
     * Set this relation to be eager.
     * Eager relations are always loaded automatically when relation's owner entity is loaded using find* methods.
     * Only using QueryBuilder prevents loading eager relations.
     * Eager flag cannot be set from both sides of relation - you can eager load only one side of the relationship.
     */
    eager?: boolean
}
