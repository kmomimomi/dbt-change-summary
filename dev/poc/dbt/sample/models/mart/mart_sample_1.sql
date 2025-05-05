with staging_data as (
    select *
    from {{ ref('int_sample_1') }}
)

select 
    id,
    name,
    created_at
from staging_data
