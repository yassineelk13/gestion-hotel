import React from 'react';

const StatCard = ({ title, value, icon, color = 'primary' }) => {
    return (
        <div className="col-md-3 mb-4">
            <div className={`card stat-card border-0 shadow-sm h-100`}>
                <div className="card-body d-flex align-items-center">
                    <div className="flex-grow-1">
                        <h6 className="text-muted mb-2">{title}</h6>
                        <h2 className="mb-0">{value}</h2>
                    </div>
                    <div className={`stat-icon bg-${color}`}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
