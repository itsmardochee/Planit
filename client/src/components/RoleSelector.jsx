import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Box,
  Tooltip,
} from '@mui/material';
import { ROLES } from '../utils/permissions';
import { ROLE_INFO } from '../hooks/usePermissions';

/**
 * RoleSelector Component
 *
 * Displays the current user role and allows admins/owners to change it.
 * Implements permission-based filtering to prevent unauthorized role changes.
 *
 * @param {Object} props
 * @param {string} props.currentRole - Current role of the user (owner, admin, member, viewer)
 * @param {Function} props.canModifyUserRole - Function to check if role change is allowed: (currentRole, newRole) => boolean
 * @param {Function} props.onRoleChange - Callback when role is changed: (newRole) => void
 * @param {boolean} [props.disabled=false] - Disable role selection (e.g., for owner protection)
 * @param {boolean} [props.loading=false] - Show loading state during role update
 */
const RoleSelector = ({
  currentRole,
  canModifyUserRole,
  onRoleChange,
  disabled = false,
  loading = false,
}) => {
  const [isChanging, setIsChanging] = useState(false);

  // Owner role cannot be changed - this is a business rule
  const isOwner = currentRole === ROLES.OWNER;
  const isDisabled = disabled || loading || isChanging;

  // Get role information for display
  const currentRoleInfo = ROLE_INFO[currentRole] || {
    label: currentRole,
    color: 'default',
    description: '',
  };

  // Get all available roles
  const allRoles = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER];

  // Handle role change
  const handleRoleChange = async event => {
    const newRole = event.target.value;

    // Don't trigger callback if same role selected
    if (newRole === currentRole) {
      return;
    }

    // Check if this role change is allowed
    if (!canModifyUserRole(currentRole, newRole)) {
      return;
    }

    setIsChanging(true);
    try {
      await onRoleChange(newRole);
    } finally {
      setIsChanging(false);
    }
  };

  // Render read-only badge for owner
  if (isOwner) {
    return (
      <Tooltip title="Owner role cannot be changed to prevent ownership transfer. To change ownership, transfer the workspace to another user first.">
        <Box sx={{ display: 'inline-block' }}>
          <FormControl disabled size="small" fullWidth>
            <Select
              value={currentRole}
              disabled
              renderValue={value => {
                const roleInfo = ROLE_INFO[value];
                return (
                  <Chip
                    label={roleInfo.label}
                    size="small"
                    sx={{
                      backgroundColor: `${roleInfo.color}.main`,
                      color: theme =>
                        theme.palette.getContrastText(
                          theme.palette[roleInfo.color]?.main || '#000'
                        ),
                      fontWeight: 600,
                    }}
                  />
                );
              }}
            >
              <MenuItem value={currentRole}>{currentRoleInfo.label}</MenuItem>
            </Select>
            <FormHelperText>Owner role cannot be changed</FormHelperText>
          </FormControl>
        </Box>
      </Tooltip>
    );
  }

  // Render interactive selector for non-owner roles
  return (
    <FormControl size="small" fullWidth disabled={isDisabled}>
      <Select
        value={currentRole}
        onChange={handleRoleChange}
        disabled={isDisabled}
        renderValue={value => {
          const roleInfo = ROLE_INFO[value];
          const label = roleInfo?.label || (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
          const color = roleInfo?.color || 'default';
          return (
            <Chip
              label={label}
              size="small"
              sx={roleInfo ? {
                backgroundColor: `${color}.main`,
                color: theme =>
                  theme.palette.getContrastText(
                    theme.palette[color]?.main || '#000'
                  ),
                fontWeight: 600,
              } : { fontWeight: 600 }}
            />
          );
        }}
      >
        {allRoles.map(role => {
          const roleInfo = ROLE_INFO[role];
          const canSelect = canModifyUserRole(currentRole, role);

          return (
            <MenuItem
              key={role}
              value={role}
              disabled={!canSelect && role !== currentRole}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                <Chip
                  label={roleInfo.label}
                  size="small"
                  sx={{
                    backgroundColor: `${roleInfo.color}.main`,
                    color: theme =>
                      theme.palette.getContrastText(
                        theme.palette[roleInfo.color]?.main || '#000'
                      ),
                    fontWeight: 600,
                  }}
                />
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                  }}
                >
                  {roleInfo.description}
                </Box>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      {loading && <FormHelperText>Updating role...</FormHelperText>}
    </FormControl>
  );
};

RoleSelector.propTypes = {
  currentRole: PropTypes.oneOf([
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.MEMBER,
    ROLES.VIEWER,
  ]).isRequired,
  canModifyUserRole: PropTypes.func.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};

RoleSelector.defaultProps = {
  disabled: false,
  loading: false,
};

export default RoleSelector;
