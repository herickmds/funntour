"""add marina_id to boats

Revision ID: 2025_04_04_164000
Revises: 
Create Date: 2025-04-04 16:40:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2025_04_04_164000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add marina_id column to boats table
    op.add_column('boats', sa.Column('marina_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_boats_marinas', 'boats', 'marinas', ['marina_id'], ['id'])


def downgrade():
    # Remove marina_id column and foreign key from boats table
    op.drop_constraint('fk_boats_marinas', 'boats', type_='foreignkey')
    op.drop_column('boats', 'marina_id')
