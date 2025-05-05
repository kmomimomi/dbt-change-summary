with staging_data as (
    select *
    from {{ ref('staging_sample_1') }}
)

select 
    id,
    name,
    created_at
from staging_data
