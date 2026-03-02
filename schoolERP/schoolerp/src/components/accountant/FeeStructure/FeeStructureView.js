import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getClasses, getFeeStructure } from "../../../feature/accounting/accountingSlice";

const FeeStructureView = () => {
    const dispatch = useDispatch();
    const { classes, currentFeeStructure, isLoading } = useSelector((state) => state.accounting);

    useEffect(() => {
        dispatch(getClasses());
    }, [dispatch]);

    const handleClassSelect = (e) => {
        const className = e.target.value;
        if (className) {
            dispatch(getFeeStructure(className));
        }
    };

    return (
        <div className="accountant-dashboard-view">
            <div className="accountant-header-container">
                <h2 className="accountant-page-title">Fee Structure Review</h2>
            </div>

            <div className="accountant-card mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class to View Structure</label>
                <select
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    onChange={handleClassSelect}
                    defaultValue=""
                >
                    <option value="" disabled>Select a class</option>
                    {classes.map(c => (
                        <option key={c._id} value={c.className}>{c.className}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Note: Fee structure changes must be made by the School Admin.</p>
            </div>

            <div className="accountant-card">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading structure...</div>
                ) : currentFeeStructure ? (
                    <div>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">
                                Structure: <span className="text-blue-600">{currentFeeStructure.className}</span>
                            </h3>
                            <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                                Active Configuration
                            </span>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                    <th className="p-4 font-semibold text-sm w-16">S.No</th>
                                    <th className="p-4 font-semibold text-sm">Fee Head Name</th>
                                    <th className="p-4 font-semibold text-sm">Frequency</th>
                                    <th className="p-4 font-semibold text-sm text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentFeeStructure.feeHeads.map((head, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-500">{index + 1}</td>
                                        <td className="p-4 font-medium text-gray-900">{head.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-md ${head.frequency === 'Monthly' ? 'bg-blue-50 text-blue-700' :
                                                    head.frequency === 'Yearly' ? 'bg-purple-50 text-purple-700' :
                                                        'bg-orange-50 text-orange-700'
                                                }`}>
                                                {head.frequency}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-right">₹ {head.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="p-4 text-right font-bold text-gray-700">Total Monthly Payable:</td>
                                    <td className="p-4 text-right font-bold text-lg text-blue-600">
                                        ₹ {currentFeeStructure.feeHeads
                                            .filter(h => h.frequency === 'Monthly')
                                            .reduce((sum, h) => sum + h.amount, 0)
                                            .toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">📋</div>
                        <p>Select a class above to view its fee structure</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeStructureView;
