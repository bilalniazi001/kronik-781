import React, { useState, useEffect } from 'react';
import hierarchyService from '../services/hierarchyService';
import Loader from '../components/common/Loader';
import { UserIcon } from '@heroicons/react/24/outline';
import '../styles/OrganizationTree.css';

const TreeNode = ({ node, isRoot = false, delay = 0 }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`tree-node-wrapper ${hasChildren ? 'has-children' : ''} ${isRoot ? 'org-tree-root' : ''}`}>
      <div 
        className="tree-node-card group animate-tree-node"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="relative z-10 flex flex-col items-center">
          {node.profile_image ? (
            <img src={node.profile_image} alt={node.name} className="tree-node-image mb-2" />
          ) : (
            <div className="tree-node-image mb-2 bg-white/20 flex items-center justify-center border border-white/30">
              <UserIcon className="w-6 h-6 text-white/50" />
            </div>
          )}
          
          <div className="tree-node-info w-full overflow-hidden">
            <h3 className="text-white drop-shadow-sm text-[11px] font-bold leading-tight truncate">{node.name}</h3>
            <p className="font-semibold text-white/70 text-[8px] uppercase tracking-tighter truncate mb-1">{node.designation || 'Member'}</p>
            <span className="role-badge-premium">
              {node.role_type}
            </span>
          </div>
        </div>
      </div>

      {hasChildren && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <TreeNode key={child.id} node={child} delay={delay + 100} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrganizationTreePage = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const response = await hierarchyService.getOrganizationTree();
        setTreeData(response.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load organization tree');
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Organization <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Structure</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            A clear view of our team hierarchy and reporting lines.
          </p>
        </div>

        {error ? (
          <div className="max-w-md mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        ) : treeData.length > 0 ? (
          <div className="org-tree-container">
            {treeData.map(root => (
              <TreeNode key={root.id} node={root} isRoot={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg mx-auto">
            <UserIcon className="w-16 h-16 text-gray-200 mx-auto" />
            <p className="text-gray-400 mt-4 text-xl font-medium">No hierarchy data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationTreePage;
