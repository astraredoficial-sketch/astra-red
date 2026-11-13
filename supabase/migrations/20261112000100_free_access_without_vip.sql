update public.app_feature_flags
set enabled = false,
    updated_at = now()
where flag = 'beta_vip_access';
