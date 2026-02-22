import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { ROLE_INFO, PERMISSION_DEFINITIONS } from '../hooks/usePermissions';

const WorkspaceSettings = () => {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  // Define permission categories for better organization
  const permissionCategories = {
    workspace: [
      'workspace:update',
      'workspace:delete',
      'workspace:view_members',
    ],
    member: ['member:invite', 'member:remove', 'member:modify_role'],
    board: ['board:create', 'board:update', 'board:delete', 'board:view'],
    list: ['list:create', 'list:update', 'list:delete', 'list:view'],
    card: [
      'card:create',
      'card:update',
      'card:delete',
      'card:view',
      'card:move',
      'card:assign',
    ],
    comment: [
      'comment:create',
      'comment:view',
      'comment:update_own',
      'comment:delete_own',
      'comment:delete_any',
    ],
    label: ['label:create', 'label:update', 'label:delete', 'label:assign'],
  };

  const roles = ['owner', 'admin', 'member', 'viewer'];

  const getRoleColor = role => {
    const colors = {
      owner: 'secondary',
      admin: 'primary',
      member: 'success',
      viewer: 'default',
    };
    return colors[role] || 'default';
  };

  const hasPermission = (role, permission) => {
    return ROLE_INFO[role]?.permissions.includes(permission);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}`)}
            className="text-blue-600 dark:text-blue-400 hover:opacity-80 text-sm mb-2 inline-block"
          >
            ← {t('common:back', 'Back to Workspace')}
          </button>
          <Typography variant="h4" component="h1" className="dark:text-white">
            {t('workspace:settingsTitle', 'Workspace Permissions')}
          </Typography>
          <Typography
            variant="body2"
            className="text-gray-600 dark:text-gray-400 mt-1"
          >
            {t(
              'workspace:settingsDescription',
              'Overview of permissions for each role in this workspace'
            )}
          </Typography>
        </div>
      </header>

      {/* Permissions Table */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Paper className="dark:bg-gray-800">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableCell className="dark:text-white font-bold">
                    {t('workspace:permissionCategory', 'Permission')}
                  </TableCell>
                  {roles.map(role => (
                    <TableCell
                      key={role}
                      align="center"
                      className="dark:text-white"
                    >
                      <Chip
                        label={role.charAt(0).toUpperCase() + role.slice(1)}
                        color={getRoleColor(role)}
                        size="small"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(permissionCategories).map(
                  ([category, permissions]) => (
                    <>
                      {/* Category Header */}
                      <TableRow key={`category-${category}`}>
                        <TableCell
                          colSpan={5}
                          className="bg-blue-50 dark:bg-blue-900 dark:text-white font-bold uppercase text-sm"
                        >
                          {t(
                            `workspace:category_${category}`,
                            category.charAt(0).toUpperCase() + category.slice(1)
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Permission Rows */}
                      {permissions.map(permission => (
                        <TableRow
                          key={permission}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <TableCell className="dark:text-gray-300">
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {PERMISSION_DEFINITIONS[permission]?.name ||
                                  permission}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500 dark:text-gray-400"
                              >
                                {PERMISSION_DEFINITIONS[permission]
                                  ?.description || ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          {roles.map(role => (
                            <TableCell key={role} align="center">
                              {hasPermission(role, permission) && (
                                <CheckIcon
                                  className="text-green-600 dark:text-green-400"
                                  fontSize="small"
                                />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Role Descriptions */}
        <Box className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map(role => (
            <Paper key={role} className="p-4 dark:bg-gray-800">
              <Chip
                label={role.charAt(0).toUpperCase() + role.slice(1)}
                color={getRoleColor(role)}
                size="small"
                className="mb-2"
              />
              <Typography
                variant="body2"
                className="text-gray-700 dark:text-gray-300 mt-2"
              >
                {t(`workspace:role_${role}_desc`, ROLE_INFO[role]?.description)}
              </Typography>
              <Typography
                variant="caption"
                className="text-gray-500 dark:text-gray-400 block mt-2"
              >
                {ROLE_INFO[role]?.permissions.length}{' '}
                {t('workspace:permissions', 'permissions')}
              </Typography>
            </Paper>
          ))}
        </Box>
      </main>
    </div>
  );
};

export default WorkspaceSettings;
