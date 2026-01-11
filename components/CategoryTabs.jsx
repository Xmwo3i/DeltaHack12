// ============================================================
// CATEGORY TABS COMPONENT
// ============================================================

import React from 'react';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
    return (
        <div className="tabs">
            {categories.map(category => (
                <button
                    key={category}
                    className={`tab ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => onCategoryChange(category)}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryTabs;